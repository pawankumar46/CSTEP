import type { ExportColumn } from "@/lib/export-utils";
import { formatParticipationDateDisplay } from "@/lib/registration-mappers";
import { getRegistrationOptionLabel } from "@/lib/registration-options";
import type { Registration, AccommodationAssistanceRow, MedicalAssistanceRow, TranslationAssistanceRow, TravelAssistanceRow } from "@/types";

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

export const ATTENDANCE_MODE_EXPORT_COLUMNS: ExportColumn<Registration>[] = [
  { header: "User Name", value: (row) => row.userName },
  { header: "Phone", value: (row) => row.phone },
  { header: "Email", value: (row) => row.email },
  {
    header: "Participation Dates",
    value: (row) => row.participationDateLabel ?? row.participationDate,
  },
  { header: "Participation Time", value: (row) => formatParticipationTime(row.participationTime) },
  {
    header: "Food Preference",
    value: (row) => getRegistrationOptionLabel(row.foodPreference),
  },
  { header: "Status", value: (row) => formatStatus(row.status) },
];

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
