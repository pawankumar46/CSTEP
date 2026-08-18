import type { ColumnDef } from "@tanstack/react-table";
import { formatRegistrationIntervalDayLabel } from "@/lib/analytics-mappers";
import type { ExportColumn } from "@/lib/export-utils";
import type { AttendanceModeUserRow } from "@/types";

export interface AttendanceModeColumnOption {
  id: string;
  label: string;
  locked?: boolean;
}

const STATIC_COLUMN_OPTIONS: AttendanceModeColumnOption[] = [
  { id: "userName", label: "User Name", locked: true },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "designation", label: "Designation" },
  { id: "orgName", label: "Organization" },
  { id: "city", label: "City" },
  { id: "state", label: "State" },
  { id: "createdAt", label: "Date of Registration" },
  { id: "updatedAt", label: "Modified" },
  { id: "status", label: "Status" },
];

export function getAttendanceModeColumnOptions(
  dayDates: readonly string[],
): AttendanceModeColumnOption[] {
  const dayOptions = dayDates.map((date) => ({
    id: `day-${date}`,
    label: formatRegistrationIntervalDayLabel(date),
  }));
  return [...STATIC_COLUMN_OPTIONS, ...dayOptions];
}

export function createDefaultAttendanceModeVisibility(
  dayDates: readonly string[],
): Set<string> {
  return new Set(getAttendanceModeColumnOptions(dayDates).map((option) => option.id));
}

export function getAttendanceModeTableColumnId(
  column: ColumnDef<AttendanceModeUserRow>,
): string | null {
  if (typeof column.id === "string" && column.id.startsWith("day-")) {
    return column.id;
  }
  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return column.accessorKey;
  }
  return null;
}

export function filterAttendanceModeTableColumns(
  columns: ColumnDef<AttendanceModeUserRow>[],
  visibleIds: Set<string>,
): ColumnDef<AttendanceModeUserRow>[] {
  return columns.filter((column) => {
    const id = getAttendanceModeTableColumnId(column);
    return id ? visibleIds.has(id) : true;
  });
}

function exportColumnId(
  column: ExportColumn<AttendanceModeUserRow>,
  dayDates: readonly string[],
): string | null {
  const staticByHeader: Record<string, string> = {
    "User Name": "userName",
    Phone: "phone",
    Email: "email",
    Designation: "designation",
    Organization: "orgName",
    City: "city",
    State: "state",
    "Date of Registration": "createdAt",
    Modified: "updatedAt",
    Status: "status",
  };

  if (staticByHeader[column.header]) {
    return staticByHeader[column.header];
  }

  for (const date of dayDates) {
    const dayLabel = formatRegistrationIntervalDayLabel(date);
    if (column.header === dayLabel || column.header === `${dayLabel} Attendance`) {
      return `day-${date}`;
    }
  }

  return null;
}

export function filterAttendanceModeExportColumns(
  columns: ExportColumn<AttendanceModeUserRow>[],
  visibleIds: Set<string>,
  dayDates: readonly string[],
): ExportColumn<AttendanceModeUserRow>[] {
  return columns.filter((column) => {
    const id = exportColumnId(column, dayDates);
    return id ? visibleIds.has(id) : true;
  });
}

export function mergeAttendanceModeVisibility(
  previous: Set<string>,
  dayDates: readonly string[],
): Set<string> {
  const options = getAttendanceModeColumnOptions(dayDates);
  const validIds = new Set(options.map((option) => option.id));
  const next = new Set<string>();

  for (const id of previous) {
    if (validIds.has(id)) next.add(id);
  }

  for (const option of options) {
    if (option.id.startsWith("day-") && !previous.has(option.id)) {
      next.add(option.id);
    }
    if (option.locked) next.add(option.id);
  }

  return next.size > 0 ? next : createDefaultAttendanceModeVisibility(dayDates);
}
