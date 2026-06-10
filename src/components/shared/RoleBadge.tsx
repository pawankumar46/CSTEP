import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/types";

const roleVariants: Record<UserRole, "default" | "secondary" | "success" | "warning"> = {
  base_user: "secondary",
  moderator: "default",
  event_administrator: "success",
  super_administrator: "warning",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={roleVariants[role]}>{ROLE_LABELS[role]}</Badge>;
}
