"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MessageSquare, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ALL_FEEDBACK_FILTER,
  buildFeedbackSummaryRows,
  buildFeedbackTableRows,
  filterFeedback,
  formatStarRatingDisplay,
  getFeedbackFilterOptions,
  type FeedbackTableRow,
} from "@/lib/feedback-mappers";
import { formatFeedbackEventDate } from "@/lib/feedback-options";
import type { ExportColumn } from "@/lib/export-utils";
import type { Feedback } from "@/types";

const FEEDBACK_EXPORT_COLUMNS: ExportColumn<FeedbackTableRow>[] = [
  { header: "Event Date", value: (row) => row.eventDate },
  { header: "Event Name", value: (row) => row.eventName },
  { header: "Session Name", value: (row) => row.sessionName },
  { header: "User Name", value: (row) => row.userName },
  { header: "Star Rating", value: (row) => row.rating },
  { header: "Comment", value: (row) => row.comments },
];

const EMPTY_FILTERS = {
  userName: ALL_FEEDBACK_FILTER,
  sessionName: ALL_FEEDBACK_FILTER,
  eventName: ALL_FEEDBACK_FILTER,
  eventDate: ALL_FEEDBACK_FILTER,
};

interface FeedbackModeratorPanelProps {
  feedback: Feedback[];
}

export function FeedbackModeratorPanel({ feedback }: FeedbackModeratorPanelProps) {
  const [userName, setUserName] = useState(ALL_FEEDBACK_FILTER);
  const [sessionName, setSessionName] = useState(ALL_FEEDBACK_FILTER);
  const [eventName, setEventName] = useState(ALL_FEEDBACK_FILTER);
  const [eventDate, setEventDate] = useState(ALL_FEEDBACK_FILTER);

  const filterOptions = useMemo(() => getFeedbackFilterOptions(feedback), [feedback]);
  const summaryRows = useMemo(() => buildFeedbackSummaryRows(feedback), [feedback]);

  const hasActiveFilters =
    userName !== ALL_FEEDBACK_FILTER ||
    sessionName !== ALL_FEEDBACK_FILTER ||
    eventName !== ALL_FEEDBACK_FILTER ||
    eventDate !== ALL_FEEDBACK_FILTER;

  const filteredFeedback = useMemo(
    () => filterFeedback(feedback, { userName, sessionName, eventName, eventDate }),
    [feedback, userName, sessionName, eventName, eventDate],
  );

  const tableRows = useMemo(
    () => buildFeedbackTableRows(filteredFeedback),
    [filteredFeedback],
  );

  const clearFilters = () => {
    setUserName(EMPTY_FILTERS.userName);
    setSessionName(EMPTY_FILTERS.sessionName);
    setEventName(EMPTY_FILTERS.eventName);
    setEventDate(EMPTY_FILTERS.eventDate);
  };

  const columns = useMemo<ColumnDef<FeedbackTableRow>[]>(
    () => [
      { accessorKey: "eventDate", header: "Event Date" },
      { accessorKey: "eventName", header: "Event Name" },
      { accessorKey: "sessionName", header: "Session Name" },
      { accessorKey: "userName", header: "User Name" },
      {
        accessorKey: "rating",
        header: "Star Rating",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.rating > 0 ? `${row.original.rating} ★` : "No Rating"}
          </span>
        ),
      },
      {
        accessorKey: "comments",
        header: "Comment",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md text-sm">{row.original.comments || "—"}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback Summary</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {summaryRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No feedback responses to summarize yet.
            </p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Date</TableHead>
                <TableHead>Session</TableHead>
                <TableHead className="text-right">Avg</TableHead>
                <TableHead className="text-right">Responses</TableHead>
                <TableHead>Respondents</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryRows.map((row) => (
                <TableRow key={`${row.eventDate}-${row.sessionName}`}>
                  <TableCell className="font-medium">{row.eventDateLabel}</TableCell>
                  <TableCell>{row.sessionName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.responseCount > 0 ? row.avgRating : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.responseCount}</TableCell>
                  <TableCell>
                    {row.respondents.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <ul className="space-y-1.5">
                        {row.respondents.map((respondent, index) => (
                          <li
                            key={`${respondent.userName}-${respondent.rating}-${index}`}
                            className="text-sm"
                          >
                            <span className="font-medium">{respondent.userName}</span>
                            <span className="mx-1.5 text-muted-foreground">·</span>
                            <span className="tabular-nums text-muted-foreground">
                              {formatStarRatingDisplay(respondent.rating)} ({respondent.rating})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.respondents.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <ul className="space-y-1.5">
                        {row.respondents.map((respondent, index) => (
                          <li key={`${respondent.userName}-comment-${index}`} className="text-sm">
                            <span className="font-medium">{respondent.userName}:</span>{" "}
                            <span className="text-muted-foreground">
                              {respondent.comments.trim() || "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Comment Section
          </CardTitle>
          <ExportMenu
            filename="feedback-comments"
            title="Feedback Comments"
            columns={FEEDBACK_EXPORT_COLUMNS}
            data={tableRows}
            label="Export"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={userName} onValueChange={setUserName}>
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FEEDBACK_FILTER}>All users</SelectItem>
                    {filterOptions.userNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Session</Label>
                <Select value={sessionName} onValueChange={setSessionName}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FEEDBACK_FILTER}>All sessions</SelectItem>
                    {filterOptions.sessionNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={eventName} onValueChange={setEventName}>
                  <SelectTrigger>
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FEEDBACK_FILTER}>All events</SelectItem>
                    {filterOptions.eventNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Select value={eventDate} onValueChange={setEventDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FEEDBACK_FILTER}>All dates</SelectItem>
                    {filterOptions.eventDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {formatFeedbackEventDate(date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0">
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>

          <DataTable
            columns={columns}
            data={tableRows}
            searchKey="userName"
            searchPlaceholder="Search by user..."
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
