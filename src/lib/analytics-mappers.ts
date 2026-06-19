import type { AnalyticsSummary, DistributionDataPoint } from "@/types";

export function mapApiUserSummary(raw: Record<string, unknown>): AnalyticsSummary {
  const eventParticipants = Number(raw.participants_registered ?? 0);
  const accepted = Number(raw.participants_accepted ?? 0);
  const rejected = Number(raw.participants_rejected ?? 0);
  const onHold = Number(raw.participants_held ?? 0);
  const pending = Number(raw.participants_pending ?? 0);

  return {
    totalUsers: Number(raw.total_registered_users ?? 0),
    eventParticipants,
    accepted,
    rejected,
    onHold,
    pending,
  };
}

export function buildStatusDistribution(summary: AnalyticsSummary): DistributionDataPoint[] {
  return [
    { name: "Accepted", value: summary.accepted, color: "#22c55e" },
    { name: "Rejected", value: summary.rejected, color: "#ef4444" },
    { name: "On Hold", value: summary.onHold, color: "#f59e0b" },
    { name: "Pending", value: summary.pending, color: "#3b82f6" },
  ].filter((item) => item.value > 0);
}
