"use client";

import { useMemo } from "react";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildDistributionTableRows } from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import {
  ANALYTICS_DISTRIBUTION_EXPORT_COLUMNS,
  ANALYTICS_METRIC_EXPORT_COLUMNS,
  type AnalyticsDistributionRow,
  type AnalyticsMetricRow,
} from "@/lib/event-analytics-export";
import type { DistributionDataPoint } from "@/types";

interface AnalyticsDistributionTableProps {
  title: string;
  data: DistributionDataPoint[];
  exportSlug: string;
  categoryHeader?: string;
  emptyMessage?: string;
}

export function AnalyticsDistributionTable({
  title,
  data,
  exportSlug,
  categoryHeader = "Category",
  emptyMessage = "No data available.",
}: AnalyticsDistributionTableProps) {
  const rows = useMemo(() => buildDistributionTableRows(data), [data]);
  const totalCount = useMemo(() => rows.reduce((sum, row) => sum + row.count, 0), [rows]);
  const exportFilename = slugifyFilename(exportSlug);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 px-4 py-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <ExportMenu
          filename={exportFilename}
          title={title}
          columns={ANALYTICS_DISTRIBUTION_EXPORT_COLUMNS}
          data={rows}
        />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <DistributionTableBody
          rows={rows}
          totalCount={totalCount}
          categoryHeader={categoryHeader}
          emptyMessage={emptyMessage}
        />
      </CardContent>
    </Card>
  );
}

interface AnalyticsMetricTableProps {
  title: string;
  rows: AnalyticsMetricRow[];
  exportSlug: string;
  emptyMessage?: string;
}

export function AnalyticsMetricTable({
  title,
  rows,
  exportSlug,
  emptyMessage = "No data available.",
}: AnalyticsMetricTableProps) {
  const exportFilename = slugifyFilename(exportSlug);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 px-4 py-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <ExportMenu
          filename={exportFilename}
          title={title}
          columns={ANALYTICS_METRIC_EXPORT_COLUMNS}
          data={rows}
        />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.metric}>
                    <TableCell className="font-medium">{row.metric}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.value}</TableCell>
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

function DistributionTableBody({
  rows,
  totalCount,
  categoryHeader,
  emptyMessage,
}: {
  rows: AnalyticsDistributionRow[];
  totalCount: number;
  categoryHeader: string;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{categoryHeader}</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead className="text-right">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.category}>
                <TableCell className="font-medium">{row.category}</TableCell>
                <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {row.sharePercent}%
                </TableCell>
              </TableRow>
            ))
          )}
          {rows.length > 0 && (
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{totalCount}</TableCell>
              <TableCell className="text-right text-muted-foreground">100%</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
