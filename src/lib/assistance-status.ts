import type { AssistanceRequestStatus } from "@/types";

export const assistanceStatusVariant: Record<
  AssistanceRequestStatus,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
  on_hold: "secondary",
};

export function formatAssistanceStatus(status: AssistanceRequestStatus): string {
  if (status === "on_hold") return "Hold";
  return status.replace("_", " ");
}
