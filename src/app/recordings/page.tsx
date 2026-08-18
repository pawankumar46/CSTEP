"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, FileVideo, RefreshCw } from "lucide-react";
import { RecordingPlayer } from "@/components/dashboard/ManageRecordings";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatParticipationDateDisplay } from "@/lib/registration-mappers";
import { formatDateTime } from "@/lib/utils";
import {
  EVENT_RECORDINGS_PAGE_SIZE,
  getEventRecordings,
} from "@/services/recording.service";
import type { EventRecording, UserRole } from "@/types";

const RECORDING_VIEW_ROLES: UserRole[] = [
  "base_user",
  "moderator",
  "event_administrator",
  "super_administrator",
];

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<EventRecording[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecordings = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEventRecordings(
        targetPage,
        EVENT_RECORDINGS_PAGE_SIZE,
      );
      setRecordings(result.rows);
      setPage(result.page);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setHasNext(result.hasNext);
      setHasPrevious(result.hasPrevious);
    } catch (loadError) {
      setRecordings([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load recordings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecordings(page);
  }, [loadRecordings, page]);

  return (
    <RouteGuard allowedRoles={RECORDING_VIEW_ROLES}>
      <div className="flex min-h-screen flex-col bg-background">
        <LandingNavbar />
        <main className="container mx-auto flex-1 space-y-6 px-4 py-8">
          <div>
            <h1 className="text-2xl font-bold">Recordings</h1>
            <p className="text-muted-foreground">
              Watch recordings from completed event sessions.
            </p>
          </div>

          {error && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadRecordings(page)}
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          <section className="space-y-4" aria-labelledby="user-recordings-heading">
            <div>
              <h2 id="user-recordings-heading" className="text-lg font-semibold">
                Available Recordings
              </h2>
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Loading recordings…"
                  : `${total} recording${total === 1 ? "" : "s"}`}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="aspect-video animate-pulse bg-muted" />
                    <CardHeader className="space-y-2 p-4">
                      <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : recordings.length === 0 && !error ? (
              <Card>
                <CardContent className="p-0">
                  <EmptyState
                    icon={FileVideo}
                    title="No recordings available"
                    description="Recordings will appear here when sessions are ready."
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recordings.map((recording) => (
                    <Card key={recording.id} className="overflow-hidden">
                      <div className="aspect-video bg-black">
                        <RecordingPlayer recording={recording} />
                      </div>
                      <CardHeader className="space-y-2 p-4">
                        <CardTitle className="line-clamp-2 text-base">
                          {recording.sessionTitle}
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatParticipationDateDisplay(recording.date)}
                          </span>
                          {recording.startedAt && (
                            <span className="block">
                              Started {formatDateTime(recording.startedAt)}
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  hasNext={hasNext}
                  hasPrevious={hasPrevious}
                  onPageChange={setPage}
                />
              </>
            )}
          </section>
        </main>
        <LandingFooter />
      </div>
    </RouteGuard>
  );
}
