"use client";

import { useMemo } from "react";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatParticipationDateTime,
  formatWatchDuration,
} from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import {
  PARTICIPATION_TIME_EXPORT_COLUMNS,
  type ParticipationTimeExportRow,
} from "@/lib/event-analytics-export";
import type { ParticipationTimeSession } from "@/types";

interface ParticipationTimeTableProps {
  sessions: ParticipationTimeSession[];
  exportSlug: string;
}

export function ParticipationTimeTable({
  sessions,
  exportSlug,
}: ParticipationTimeTableProps) {
  const exportRows: ParticipationTimeExportRow[] = useMemo(
    () =>
      sessions.map((session) => ({
        userName: session.userName,
        email: session.email ?? "",
        loggedIn: formatParticipationDateTime(session.loggedInAt),
        loggedOut: session.loggedOutAt
          ? formatParticipationDateTime(session.loggedOutAt)
          : "Still watching",
        duration: formatWatchDuration(session.durationSeconds),
      })),
    [sessions],
  );

  const exportFilename = slugifyFilename(exportSlug);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 px-4 py-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">Participation Duration</CardTitle>
          <CardDescription>
            Viewer name, email, join time, leave time, and watch duration.
          </CardDescription>
        </div>
        <ExportMenu
          filename={exportFilename}
          title="Participation duration"
          columns={PARTICIPATION_TIME_EXPORT_COLUMNS}
          data={exportRows}
          disabled={exportRows.length === 0}
        />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined at</TableHead>
                <TableHead>Left at</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                    No participation duration data yet.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {session.userName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {session.email?.trim() || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatParticipationDateTime(session.loggedInAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {session.loggedOutAt
                        ? formatParticipationDateTime(session.loggedOutAt)
                        : (
                          <span className="text-emerald-600 dark:text-emerald-400">Still watching</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatWatchDuration(session.durationSeconds)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
