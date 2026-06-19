import type { ExportColumn } from "@/lib/export-utils";
import { getRegistrationOptionLabel } from "@/lib/registration-options";
import type { Registration } from "@/types";

function formatParticipationTime(value: Registration["participationTime"]): string {
  return value === "full_day" ? "Full Day" : "Half Day";
}

function formatStatus(value: Registration["status"]): string {
  return value.replace("_", " ");
}

export const LOBBY_EXPORT_COLUMNS: ExportColumn<Registration>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Phone Number", value: (row) => row.phone },
  { header: "Email", value: (row) => row.email },
  {
    header: "Participation Date",
    value: (row) => row.participationDateLabel ?? row.participationDate,
  },
  { header: "Participation Time", value: (row) => formatParticipationTime(row.participationTime) },
  { header: "Status", value: (row) => formatStatus(row.status) },
];

export const TRAVEL_EXPORT_COLUMNS: ExportColumn<Registration>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Email", value: (row) => row.email },
  { header: "Phone", value: (row) => row.phone },
  { header: "Travel Arrangement", value: (row) => row.travelArrangementLabel ?? "" },
  { header: "Travel Status", value: (row) => row.travelStatus ?? "pending" },
];

export const TRANSLATION_EXPORT_COLUMNS: ExportColumn<Registration>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Email", value: (row) => row.email },
  { header: "Phone", value: (row) => row.phone },
  {
    header: "Requested Language",
    value: (row) =>
      row.translationLanguage ? getRegistrationOptionLabel(row.translationLanguage) : "",
  },
  { header: "Translation Status", value: (row) => row.translationStatus ?? "pending" },
];
