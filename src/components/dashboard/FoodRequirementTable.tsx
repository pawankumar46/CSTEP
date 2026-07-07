"use client";

import { useMemo, useState } from "react";
import { ChartFilterGroup } from "@/components/shared/ChartFilterGroup";
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
import { FOOD_REQUIREMENT_EXPORT_COLUMNS } from "@/lib/food-requirement-export";
import { slugifyFilename } from "@/lib/export-utils";
import {
  buildAllFoodRequirementRows,
  buildFoodRequirementRows,
  type FoodRequirementDay,
} from "@/lib/moderator-dashboard-charts";

const FOOD_REQUIREMENT_DAY_OPTIONS = [
  { value: "19th August" as const, label: "19th August" },
  { value: "20th August" as const, label: "20th August" },
];

export function FoodRequirementTable() {
  const [selectedDay, setSelectedDay] = useState<FoodRequirementDay>("19th August");

  const rows = useMemo(() => buildFoodRequirementRows(selectedDay), [selectedDay]);
  const totalCount = useMemo(() => rows.reduce((sum, row) => sum + row.count, 0), [rows]);

  const exportFilename = slugifyFilename(`food-requirement-${selectedDay}`);
  const exportTitle = `Food Requirement — ${selectedDay}`;

  const allRows = useMemo(() => buildAllFoodRequirementRows(), []);
  const allDatesFilename = slugifyFilename("food-requirement-all-dates");

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-3 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-sm font-semibold">Food Requirement</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              filename={exportFilename}
              title={exportTitle}
              columns={FOOD_REQUIREMENT_EXPORT_COLUMNS}
              data={rows}
              label="Export day"
            />
            <ExportMenu
              filename={allDatesFilename}
              title="Food Requirement — All Dates"
              columns={FOOD_REQUIREMENT_EXPORT_COLUMNS}
              data={allRows}
              label="Export all dates"
            />
          </div>
        </div>
        <ChartFilterGroup
          options={FOOD_REQUIREMENT_DAY_OPTIONS}
          value={selectedDay}
          onChange={setSelectedDay}
        />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Food preference</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                    No food requirements for {selectedDay}.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={`${row.date}-${row.preference}`}>
                    <TableCell className="font-medium">{row.preference}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {row.sharePercent}%
                    </TableCell>
                  </TableRow>
                ))
              )}
              {rows.length > 0 && (
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableCell className="font-medium">Total ({selectedDay})</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{totalCount}</TableCell>
                  <TableCell className="text-right text-muted-foreground">100%</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
