import type { Notification, UserRole } from "@/types";

/** Offline fixtures only — live app uses Django `/notification/notification/`. */
export const mockStaffNotifications: Notification[] = [
  {
    id: "1",
    notificationType: "REGISTRATION_STATUS_UPDATE",
    title: "New lobby registrations",
    message: "5 participants are pending review for ICAS 2026.",
    type: "warning",
    read: false,
    createdAt: "2026-08-08T08:00:00Z",
    href: "/dashboard/lobby",
  },
  {
    id: "2",
    notificationType: "ASSISTANCE_STATUS_UPDATE",
    title: "Travel assistance request",
    message: "A new travel support request needs attention.",
    type: "info",
    read: false,
    createdAt: "2026-08-08T07:30:00Z",
    href: "/dashboard/travel",
  },
];

export const mockUserNotifications: Notification[] = [
  {
    id: "3",
    notificationType: "REGISTRATION_CONFIRMED",
    title: "Registration Confirmed",
    message: "Your registration for ICAS 2026 has been accepted.",
    type: "success",
    read: false,
    createdAt: "2026-08-07T10:00:00Z",
    href: "/my-registrations",
  },
  {
    id: "4",
    notificationType: "BROADCAST_LIVE",
    title: "Broadcast is live",
    message: "The event stream is now live. Tap to watch.",
    type: "success",
    read: true,
    createdAt: "2026-08-05T08:30:00Z",
    href: "/streaming",
  },
];

export function mockNotificationsForRole(role: UserRole | undefined): Notification[] {
  if (!role) return [];
  if (role === "base_user") return mockUserNotifications.map((n) => ({ ...n }));
  return mockStaffNotifications.map((n) => ({ ...n }));
}
