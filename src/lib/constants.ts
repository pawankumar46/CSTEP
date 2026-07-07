import type { UserRole } from "@/types";
import { readPublicEnv } from "@/lib/env";
import { buildDriveEmbedUrl } from "@/lib/stream-utils";
import { ICAS_CONFERENCE } from "@/lib/icas-conference";

export const APP_NAME = "CSTEP";
export const APP_SHORT_NAME = "CS";
export const BRAND_LOGO_SRC = "/CstepLogo.png";
export const BRAND_LOGO_DARK_SRC =
  readPublicEnv("NEXT_PUBLIC_BRAND_LOGO_DARK_SRC") ?? "/CSTEP_Primary-Logo%20copy.png";
export const APP_DESCRIPTION =
  "CSTEP event management platform for ICAS 2026 registration, live streaming, and delegate coordination";

export const FEATURED_EVENT = {
  name: ICAS_CONFERENCE.name,
  dates: ICAS_CONFERENCE.datesLabel,
  location: ICAS_CONFERENCE.venue,
  theme: ICAS_CONFERENCE.theme,
};

/** Default Drive file when env is unset (e.g. missing Vercel build env). */
const DEFAULT_LIVE_STREAM_FILE_ID = "1GwhnrClhI3WF-SO-lYmIZ8l3-YETBBP-";
export const LIVE_STREAM_FILE_ID =
  readPublicEnv("NEXT_PUBLIC_LIVE_STREAM_FILE_ID") ?? DEFAULT_LIVE_STREAM_FILE_ID;

export const LIVE_STREAM_URL =
  readPublicEnv("NEXT_PUBLIC_LIVE_STREAM_URL") ??
  buildDriveEmbedUrl(LIVE_STREAM_FILE_ID);

/** Vertical side banners shown beside the live stream (hidden in fullscreen). */
export const STREAM_LEFT_BANNER_URL =
  readPublicEnv("NEXT_PUBLIC_STREAM_LEFT_BANNER_URL") ?? "/CstepLeft1.jpeg";

export const STREAM_RIGHT_BANNER_URL =
  readPublicEnv("NEXT_PUBLIC_STREAM_RIGHT_BANNER_URL") ?? "/CstepRight1.jpeg";

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

export type NavChildItem = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href?: string;
  icon: string;
  roles: readonly UserRole[];
  children?: readonly NavChildItem[];
};

export const LOBBY_NAV_PATHS = [
  "/dashboard/lobby",
  "/dashboard/sessions",
  "/dashboard/travel",
  "/dashboard/medical",
  "/dashboard/translation",
  "/dashboard/accommodation",
] as const;

export const ANALYTICS_NAV_PATHS = [
  "/dashboard/analytics",
  "/dashboard/analytics/attendance-mode",
] as const;

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: "Home", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Events", href: "/dashboard/events", icon: "Calendar", roles: ["moderator", "event_administrator", "super_administrator"] },
  {
    label: "Video Management",
    href: "/dashboard/video-management",
    icon: "Video",
    roles: ["event_administrator"],
  },
  {
    label: "Lobby",
    icon: "Users",
    roles: ["moderator", "event_administrator", "super_administrator"],
    children: [
      { label: "Manage Lobby", href: "/dashboard/lobby" },
      { label: "Manage Sessions", href: "/dashboard/sessions" },
      { label: "Manage Travel Requests", href: "/dashboard/travel" },
      { label: "Manage Medical Requests", href: "/dashboard/medical" },
      { label: "Manage Translation Requests", href: "/dashboard/translation" },
      { label: "Manage Accommodation Requests", href: "/dashboard/accommodation" },
    ],
  },
  {
    label: "Analytics",
    icon: "BarChart3",
    roles: ["moderator", "event_administrator", "super_administrator"],
    children: [
      { label: "Overview", href: "/dashboard/analytics" },
      { label: "Attendance Mode", href: "/dashboard/analytics/attendance-mode" },
    ],
  },
  { label: "Feedback", href: "/dashboard/feedback", icon: "MessageSquare", roles: ["moderator", "event_administrator", "super_administrator"] },
  { label: "Users", href: "/dashboard/users", icon: "UserCog", roles: ["super_administrator"] },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ["moderator", "event_administrator", "super_administrator"] },
];
