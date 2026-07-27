import type { ExportColumn } from "@/lib/export-utils";
import { formatRegistrationIntervalDayLabel } from "@/lib/analytics-mappers";
import { formatParticipationDateDisplay } from "@/lib/registration-mappers";
import { getRegistrationOptionLabel } from "@/lib/registration-options";
import { formatDateTime } from "@/lib/utils";
import type {
  Registration,
  AccommodationAssistanceRow,
  AttendanceModeUserRow,
  MedicalAssistanceRow,
  TranslationAssistanceRow,
  TravelAssistanceRow,
} from "@/types";

export const ATTENDANCE_MODE_EXPORT_DAY_DATES = ["2026-08-19", "2026-08-20", "2026-08-21"] as const;

function formatParticipationTime(value: Registration["participationTime"]): string {
  return value === "full_day" ? "Full Day" : "Half Day";
}

function formatStatus(value: Registration["status"]): string {
  return value.replace("_", " ");
}

function attendanceModeForDate(row: AttendanceModeUserRow, date: string): string {
  const day = row.days.find((item) => item.date === date);
  if (!day) return "—";
  return day.attendanceMode === "virtual" ? "Virtual" : "Physical";
}

/** Lobby list: mode for a conference day from `registration_dates`, or —. */
export function lobbyAttendanceModeForDate(row: Registration, date: string): string {
  const entry = row.registrationDates?.find((item) => item.date === date);
  if (!entry) return "—";
  return entry.attendanceMode === "virtual" ? "Virtual" : "Physical";
}

export const LOBBY_EXPORT_COLUMNS: ExportColumn<Registration>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Phone Number", value: (row) => row.phone },
  { header: "Email", value: (row) => row.email },
  ...ATTENDANCE_MODE_EXPORT_DAY_DATES.map((date) => ({
    header: formatRegistrationIntervalDayLabel(date),
    value: (row: Registration) => lobbyAttendanceModeForDate(row, date),
  })),
  { header: "Sessions", value: (row) => row.registeredSessionsCount ?? 0 },
  { header: "Status", value: (row) => formatStatus(row.status) },
];

export const ATTENDANCE_MODE_EXPORT_COLUMNS: ExportColumn<Registration>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Phone", value: (row) => row.phone },
  { header: "Email", value: (row) => row.email },
  { header: "Sessions", value: (row) => row.registeredSessionsCount ?? 0 },
  {
    header: "Participation Dates",
    value: (row) => row.participationDateLabel ?? row.participationDate,
  },
  { header: "Participation Time", value: (row) => formatParticipationTime(row.participationTime) },
  { header: "Status", value: (row) => formatStatus(row.status) },
];

export const ATTENDANCE_MODE_USERS_EXPORT_COLUMNS: ExportColumn<AttendanceModeUserRow>[] =
  getAttendanceModeUsersExportColumns();

/** Day columns follow the participation-day filter (`all` → every day). */
export function getAttendanceModeUsersExportColumns(
  dayDate: string = "all",
): ExportColumn<AttendanceModeUserRow>[] {
  const dayDates =
    dayDate === "all"
      ? [...ATTENDANCE_MODE_EXPORT_DAY_DATES]
      : ATTENDANCE_MODE_EXPORT_DAY_DATES.filter((date) => date === dayDate);

  return [
    { header: "User Name", value: (row) => row.userName },
    { header: "Phone", value: (row) => row.phone },
    { header: "Email", value: (row) => row.email },
    { header: "Designation", value: (row) => row.designation },
    { header: "Organization", value: (row) => row.orgName },
    { header: "City", value: (row) => row.city },
    { header: "State", value: (row) => row.state },
    ...dayDates.map((date) => ({
      header: formatRegistrationIntervalDayLabel(date),
      value: (row: AttendanceModeUserRow) => attendanceModeForDate(row, date),
    })),
    {
      header: "Date of Registration",
      value: (row) => (row.createdAt ? formatDateTime(row.createdAt) : "—"),
    },
    {
      header: "Modified",
      value: (row) => (row.updatedAt ? formatDateTime(row.updatedAt) : "—"),
    },
    { header: "Status", value: (row) => formatStatus(row.status) },
  ];
}

export const TRAVEL_EXPORT_COLUMNS: ExportColumn<TravelAssistanceRow>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Email", value: (row) => row.email },
  { header: "Phone", value: (row) => row.phone },
  { header: "Transport Mode", value: (row) => row.transportModeLabel },
  { header: "From", value: (row) => row.sourceLocation },
  { header: "To", value: (row) => row.destinationLocation },
  {
    header: "Travel Date",
    value: (row) => formatParticipationDateDisplay(row.travelDate),
  },
  { header: "Status", value: (row) => row.status },
];

export const TRANSLATION_EXPORT_COLUMNS: ExportColumn<TranslationAssistanceRow>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Email", value: (row) => row.email },
  { header: "Phone", value: (row) => row.phone },
  {
    header: "Requested Language",
    value: (row) => getRegistrationOptionLabel(row.language),
  },
  {
    header: "Required Date",
    value: (row) => formatParticipationDateDisplay(row.requiredDate),
  },
  { header: "Status", value: (row) => row.status },
];

export const MEDICAL_EXPORT_COLUMNS: ExportColumn<MedicalAssistanceRow>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Email", value: (row) => row.email },
  { header: "Phone", value: (row) => row.phone },
  { header: "Medical Needs", value: (row) => row.medicalNeeds },
  {
    header: "Required Date",
    value: (row) => formatParticipationDateDisplay(row.requiredDate),
  },
  { header: "Status", value: (row) => row.status },
];

export const ACCOMMODATION_EXPORT_COLUMNS: ExportColumn<AccommodationAssistanceRow>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Email", value: (row) => row.email },
  { header: "Phone", value: (row) => row.phone },
  { header: "Hotel", value: (row) => row.hotelName },
  { header: "Address", value: (row) => row.address },
  { header: "Room", value: (row) => row.roomNo },
  {
    header: "From Date",
    value: (row) => formatParticipationDateDisplay(row.fromDate),
  },
  {
    header: "To Date",
    value: (row) => formatParticipationDateDisplay(row.toDate),
  },
  { header: "Status", value: (row) => row.status },
];
