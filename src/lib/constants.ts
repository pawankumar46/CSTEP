import type { UserRole } from "@/types";

export const APP_NAME = "CSTEP";
export const APP_SHORT_NAME = "CS";
export const APP_DESCRIPTION =
  "CSTEP event management platform for registration, live streaming, and delegate coordination";

export const FEATURED_EVENT = {
  name: "CSTEP Annual Conference 2025",
  dates: "21st – 22nd August 2025",
  location: "Hybrid — In-person & Virtual",
};

/** Google Drive file preview URL for the live stream (C1581.mp4). */
export const LIVE_STREAM_URL =
  process.env.NEXT_PUBLIC_LIVE_STREAM_URL ??
  "https://drive.google.com/file/d/1GwhnrClhI3WF-SO-lYmIZ8l3-YETBBP-/preview";

/** Direct Google Drive file ID for C1581.mp4 (used when folder resolution fails). */
export const LIVE_STREAM_FILE_ID =
  process.env.NEXT_PUBLIC_LIVE_STREAM_FILE_ID ?? "1GwhnrClhI3WF-SO-lYmIZ8l3-YETBBP-";

export const ROLE_LABELS: Record<UserRole, string> = {
  base_user: "Base User",
  moderator: "Moderator",
  event_administrator: "Event Administrator",
  super_administrator: "Super Administrator",
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  base_user: 1,
  moderator: 2,
  event_administrator: 3,
  super_administrator: 4,
};

export const NAV_ITEMS = [
  { label: "Home", href: "/", icon: "Home", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Events", href: "/dashboard/events", icon: "Calendar", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Lobby", href: "/dashboard/lobby", icon: "Users", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Travel", href: "/dashboard/travel", icon: "Plane", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Translation", href: "/dashboard/translation", icon: "Languages", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Analytics", href: "/dashboard/analytics", icon: "BarChart3", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Recordings", href: "/dashboard/recordings", icon: "Video", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Feedback", href: "/dashboard/feedback", icon: "MessageSquare", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Users", href: "/dashboard/users", icon: "UserCog", roles: ["super_administrator"] },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ["moderator", "event_administrator", "super_administrator"] },
] as const;
