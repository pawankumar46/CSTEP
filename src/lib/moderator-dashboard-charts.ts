import { mockModeratorChartVariants } from "@/mock/analytics";
import type { AnalyticsData, DistributionDataPoint, TrendDataPoint } from "@/types";

export type RegistrationTrendPeriod = "daily" | "weekly" | "monthly";
export type ParticipationTrendMode = "physical" | "virtual" | "all";
export type FoodRequirementDay = "19th August" | "20th August";

export function getRegistrationTrendData(
  analytics: AnalyticsData,
  period: RegistrationTrendPeriod,
): TrendDataPoint[] {
  switch (period) {
    case "daily":
      return [...mockModeratorChartVariants.registrationTrendDaily];
    case "weekly":
      return [...mockModeratorChartVariants.registrationTrendWeekly];
    case "monthly":
      return analytics.monthlyRegistrations;
    default:
      return analytics.registrationTrend;
  }
}

export function getParticipationTrendData(
  analytics: AnalyticsData,
  mode: ParticipationTrendMode,
): TrendDataPoint[] {
  switch (mode) {
    case "physical":
      return [...mockModeratorChartVariants.participationTrendPhysical];
    case "virtual":
      return [...mockModeratorChartVariants.participationTrendVirtual];
    case "all":
      return analytics.participationTrend;
    default:
      return analytics.participationTrend;
  }
}

export function getFoodRequirementData(day: FoodRequirementDay): DistributionDataPoint[] {
  return day === "19th August"
    ? [...mockModeratorChartVariants.foodRequirement19Aug]
    : [...mockModeratorChartVariants.foodRequirement20Aug];
}

export interface FoodRequirementRow {
  date: FoodRequirementDay;
  preference: string;
  count: number;
  sharePercent: number;
}

export const FOOD_REQUIREMENT_DAYS: FoodRequirementDay[] = ["19th August", "20th August"];

export function buildFoodRequirementRows(day: FoodRequirementDay): FoodRequirementRow[] {
  const items = getFoodRequirementData(day);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return items.map((item) => ({
    date: day,
    preference: item.name,
    count: item.value,
    sharePercent: total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0,
  }));
}

export function buildAllFoodRequirementRows(): FoodRequirementRow[] {
  return FOOD_REQUIREMENT_DAYS.flatMap((day) => buildFoodRequirementRows(day));
}
