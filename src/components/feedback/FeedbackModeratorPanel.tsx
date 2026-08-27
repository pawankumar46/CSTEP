"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ChevronDown, MessageSquare, Star, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { SearchBar } from "@/components/shared/SearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_FEEDBACK_FILTER,
  buildAnalyticsFeedbackHighlightCounts,
  buildAnalyticsFeedbackSessionSummaries,
  buildFeedbackHighlightCounts,
  buildFeedbackRespondentRows,
  buildFeedbackSessionSummaries,
  formatStarRatingDisplay,
  type FeedbackRatingFilter,
  type FeedbackRespondentRow,
  type FeedbackSessionSummary,
} from "@/lib/feedback-mappers";
import {
  DEFAULT_FEEDBACK_EVENT_ID,
  formatFeedbackEventDate,
} from "@/lib/feedback-options";
import type { ExportColumn } from "@/lib/export-utils";
import { cn } from "@/lib/utils";
import type { FeedbackPaginationState } from "@/store/useFeedbackStore";
import type { EventFeedbackAnalytics, Feedback } from "@/types";

const RATING_FILTERS: { value: FeedbackRatingFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: 5, label: "5★" },
  { value: 4, label: "4★" },
  { value: 3, label: "3★" },
  { value: 2, label: "2★" },
  { value: 1, label: "1★" },
];

const RESPONDENT_EXPORT_COLUMNS: ExportColumn<FeedbackRespondentRow>[] = [
  { header: "Respondent", value: (row) => row.userName },
  { header: "Email", value: (row) => row.userEmail ?? "" },
  { header: "Phone", value: (row) => row.userPhone ?? "" },
  { header: "Session", value: (row) => row.sessionTitle },
  { header: "Rating", value: (row) => row.rating },
  { header: "Comment", value: (row) => row.comments },
  { header: "Submitted", value: (row) => row.submittedAt },
];

interface FeedbackModeratorPanelProps {
  feedback: Feedback[];
  respondentFeedback: Feedback[];
  respondentLoading?: boolean;
  respondentPagination: FeedbackPaginationState;
  onRespondentFiltersChange: (filters: RespondentFeedbackFilters) => void;
  analytics?: EventFeedbackAnalytics | null;
  analyticsLoading?: boolean;
}

export interface RespondentFeedbackFilters {
  eventId?: string;
  eventDateId?: string;
  userId?: string;
  rating?: number;
  search?: string;
  page?: number;
}

function SessionRatingBar({ avgRating }: { avgRating: number }) {
  const percent = Math.min(100, Math.max(0, (avgRating / 5) * 100));
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            avgRating >= 4 ? "bg-emerald-500" : avgRating >= 3 ? "bg-amber-500" : "bg-destructive/70",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
        {avgRating.toFixed(1)}
      </span>
    </div>
  );
}

function FeedbackSessionRow({
  session,
  expanded,
  onToggle,
}: {
  session: FeedbackSessionSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{session.sessionTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.responseCount} response{session.responseCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="w-full sm:w-40">
          <SessionRatingBar avgRating={session.avgRating} />
        </div>
      </button>
      {expanded && (
        <div className="space-y-2 border-t px-4 py-3">
          {session.responses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Individual responses are unavailable for this session.
            </p>
          ) : (
            session.responses.map((response) => (
              <div
                key={response.id}
                className="rounded-md border border-border/60 bg-muted/20 px-3 py-2.5 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{response.userName}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {response.rating} ★ · {formatStarRatingDisplay(response.rating)}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {response.comments.trim() || "No comment provided."}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function FeedbackModeratorPanel({
  feedback,
  respondentFeedback,
  respondentLoading = false,
  respondentPagination,
  onRespondentFiltersChange,
  analytics,
  analyticsLoading = false,
}: FeedbackModeratorPanelProps) {
  const [eventId, setEventId] = useState(DEFAULT_FEEDBACK_EVENT_ID);
  const [userId, setUserId] = useState(ALL_FEEDBACK_FILTER);
  const [eventDateId, setEventDateId] = useState(ALL_FEEDBACK_FILTER);
  const [ratingFilter, setRatingFilter] = useState<FeedbackRatingFilter>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const highlightCounts = useMemo(
    () =>
      analytics
        ? buildAnalyticsFeedbackHighlightCounts(analytics)
        : buildFeedbackHighlightCounts(feedback),
    [analytics, feedback],
  );
  const sessionSummaries = useMemo(
    () =>
      analytics
        ? buildAnalyticsFeedbackSessionSummaries(analytics, feedback)
        : buildFeedbackSessionSummaries(feedback),
    [analytics, feedback],
  );
  const eventOptions = useMemo(
    () =>
      [...new Map(feedback.map((item) => [item.eventId, item.eventName])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [feedback],
  );
  const userOptions = useMemo(
    () =>
      [...new Map(feedback.map((item) => [item.userId, item.userName])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [feedback],
  );
  const dateOptions = useMemo(
    () =>
      [
        ...new Map(
          feedback
            .filter((item) => item.eventDayId)
            .map((item) => [
              item.eventDayId!,
              formatFeedbackEventDate(item.sessionDate),
            ]),
        ).entries(),
      ].map(([id, label]) => ({ id, label })),
    [feedback],
  );

  const hasActiveDetailFilters =
    eventId !== DEFAULT_FEEDBACK_EVENT_ID
    || userId !== ALL_FEEDBACK_FILTER
    || eventDateId !== ALL_FEEDBACK_FILTER
    || ratingFilter !== "all"
    || Boolean(appliedSearch);

  const respondentRows = useMemo(
    () => buildFeedbackRespondentRows(respondentFeedback),
    [respondentFeedback],
  );

  const applyRespondentFilters = (
    overrides: Partial<{
      eventId: string;
      eventDateId: string;
      userId: string;
      rating: FeedbackRatingFilter;
      search: string;
      page: number;
    }> = {},
  ) => {
    const nextEventId = overrides.eventId ?? eventId;
    const nextEventDateId = overrides.eventDateId ?? eventDateId;
    const nextUserId = overrides.userId ?? userId;
    const nextRating = overrides.rating ?? ratingFilter;
    const nextSearch = overrides.search ?? appliedSearch;
    const nextPage = overrides.page ?? 1;
    onRespondentFiltersChange({
      eventId: nextEventId || undefined,
      eventDateId:
        nextEventDateId === ALL_FEEDBACK_FILTER ? undefined : nextEventDateId,
      userId: nextUserId === ALL_FEEDBACK_FILTER ? undefined : nextUserId,
      rating: nextRating === "all" ? undefined : nextRating,
      search: nextSearch.trim() || undefined,
      page: nextPage,
    });
  };

  const clearDetailFilters = () => {
    setEventId(DEFAULT_FEEDBACK_EVENT_ID);
    setUserId(ALL_FEEDBACK_FILTER);
    setEventDateId(ALL_FEEDBACK_FILTER);
    setRatingFilter("all");
    setSearchDraft("");
    setAppliedSearch("");
    onRespondentFiltersChange({ eventId: DEFAULT_FEEDBACK_EVENT_ID, page: 1 });
  };

  const toggleSession = (key: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const columns = useMemo<ColumnDef<FeedbackRespondentRow>[]>(
    () => [
      { accessorKey: "userName", header: "Respondent" },
      {
        accessorKey: "userEmail",
        header: "Email",
        cell: ({ row }) => row.original.userEmail || "—",
      },
      {
        accessorKey: "userPhone",
        header: "Phone",
        cell: ({ row }) => row.original.userPhone || "—",
      },
      { accessorKey: "sessionTitle", header: "Session" },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.rating > 0 ? `${row.original.rating} ★` : "No rating"}
          </span>
        ),
      },
      {
        accessorKey: "comments",
        header: "Comment",
        cell: ({ row }) => (
          <span className="line-clamp-2 block max-w-md text-sm">
            {row.original.comments || "—"}
          </span>
        ),
      },
      { accessorKey: "submittedAt", header: "Submitted" },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback highlight cards</CardTitle>
          <CardDescription>
            {analytics
              ? `${analytics.overall.totalFeedback} total responses · ${analytics.overall.averageRating.toFixed(1)} average rating`
              : "Response counts by star rating (5★–1★)."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {analyticsLoading && !analytics ? (
            <p className="text-sm text-muted-foreground">Loading feedback analytics…</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {highlightCounts.map((group) => (
              <div
                key={group.rating}
                className="rounded-md border bg-muted/20 px-3.5 py-2.5 shadow-sm"
              >
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current shrink-0" aria-hidden />
                  <span className="text-sm font-semibold">{group.rating}★</span>
                </div>
                <p className="text-2xl font-bold tabular-nums leading-tight mt-1">
                  {group.count}
                </p>
                <p className="text-[11px] leading-none text-muted-foreground mt-1">
                  {group.count === 1 ? "response" : "responses"}
                </p>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall feedback per session</CardTitle>
          <CardDescription>
            Grouped by schedule item, sorted by average rating (highest first).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics && analytics.byDay.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {analytics.byDay.map((day) => (
                <div
                  key={day.eventDayId || String(day.dayNumber)}
                  className="rounded-md border bg-muted/20 px-3 py-2 text-xs"
                >
                  <span className="font-medium">
                    {day.eventDate
                      ? formatFeedbackEventDate(day.eventDate)
                      : `Day ${day.dayNumber}`}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {day.totalFeedback} responses · {day.averageRating.toFixed(1)}★
                  </span>
                </div>
              ))}
            </div>
          )}
          {analyticsLoading && !analytics ? (
            <p className="text-sm text-muted-foreground">Loading session feedback…</p>
          ) : sessionSummaries.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No session feedback"
              description="Session ratings will appear here once attendees submit feedback."
            />
          ) : (
            <div className="max-h-[min(22rem,50vh)] space-y-3 overflow-y-auto overscroll-contain pr-1">
              {sessionSummaries.map((session) => (
                <FeedbackSessionRow
                  key={session.key}
                  session={session}
                  expanded={expandedSessions.has(session.key)}
                  onToggle={() => toggleSession(session.key)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Respondent details</CardTitle>
            <CardDescription>
              {respondentPagination.total} responses · Server filters and pagination.
            </CardDescription>
          </div>
          <ExportMenu
            filename="feedback-respondents"
            title="Feedback Respondents"
            columns={RESPONDENT_EXPORT_COLUMNS}
            data={respondentRows}
            label="Export"
            disabled={respondentLoading || respondentRows.length === 0}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="feedback-event-filter">Event</Label>
                <Select
                  value={eventId}
                  onValueChange={(value) => {
                    setEventId(value);
                    setEventDateId(ALL_FEEDBACK_FILTER);
                    applyRespondentFilters({
                      eventId: value,
                      eventDateId: ALL_FEEDBACK_FILTER,
                    });
                  }}
                  disabled={respondentLoading}
                >
                  <SelectTrigger id="feedback-event-filter">
                    <SelectValue placeholder="Choose event" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventOptions.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-user-filter">Users</Label>
                <Select
                  value={userId}
                  onValueChange={(value) => {
                    setUserId(value);
                    applyRespondentFilters({ userId: value });
                  }}
                  disabled={respondentLoading}
                >
                  <SelectTrigger id="feedback-user-filter">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FEEDBACK_FILTER}>All users</SelectItem>
                    {userOptions.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-date-filter">Event date</Label>
                <Select
                  value={eventDateId}
                  onValueChange={(value) => {
                    setEventDateId(value);
                    applyRespondentFilters({ eventDateId: value });
                  }}
                  disabled={respondentLoading}
                >
                  <SelectTrigger id="feedback-date-filter">
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FEEDBACK_FILTER}>All dates</SelectItem>
                    {dateOptions.map((date) => (
                      <SelectItem key={date.id} value={date.id}>
                        {date.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-search">Search</Label>
                <SearchBar
                  value={searchDraft}
                  onChange={setSearchDraft}
                  onSubmit={() => {
                    const next = searchDraft.trim();
                    setAppliedSearch(next);
                    applyRespondentFilters({ search: next });
                  }}
                  onClear={() => {
                    setSearchDraft("");
                    setAppliedSearch("");
                    applyRespondentFilters({ search: "" });
                  }}
                  placeholder="Name, email, comment…"
                />
              </div>
            </div>
            {hasActiveDetailFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearDetailFilters}
                className="shrink-0"
              >
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by rating">
            {RATING_FILTERS.map((option) => {
              const active = ratingFilter === option.value;
              return (
                <Button
                  key={String(option.value)}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  disabled={respondentLoading}
                  onClick={() => {
                    setRatingFilter(option.value);
                    applyRespondentFilters({ rating: option.value });
                  }}
                  aria-pressed={active}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>

          {respondentLoading ? (
            <div className="rounded-lg border px-4 py-10 text-center text-sm text-muted-foreground">
              Loading respondent details…
            </div>
          ) : respondentRows.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              No responses match the selected filters.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={respondentRows}
              serverPagination={{
                page: respondentPagination.page,
                totalPages: respondentPagination.totalPages,
                hasNext: respondentPagination.hasNext,
                hasPrevious: respondentPagination.hasPrevious,
                onPageChange: (page) => applyRespondentFilters({ page }),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
