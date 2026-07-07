import type { ExportColumn } from "@/lib/export-utils";
import type { FoodRequirementRow } from "@/lib/moderator-dashboard-charts";

export const FOOD_REQUIREMENT_EXPORT_COLUMNS: ExportColumn<FoodRequirementRow>[] = [
  { header: "Date", value: (row) => row.date },
  { header: "Food Preference", value: (row) => row.preference },
  { header: "Count", value: (row) => row.count },
  { header: "Share (%)", value: (row) => row.sharePercent },
];
