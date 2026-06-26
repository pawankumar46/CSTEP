import type { User } from "@/types";

export function formatUserFullName(
  user: Pick<User, "firstName" | "middleName" | "lastName">,
): string {
  return [user.firstName, user.middleName?.trim(), user.lastName]
    .filter(Boolean)
    .join(" ");
}
