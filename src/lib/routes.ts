export const ROUTES = {
  home: "/",
  signup: "/signup",
  login: "/login",
  otp: "/otp",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  eventRegister: "/event-register",
  streaming: "/streaming",
  profile: "/profile",
  myRegistrations: "/my-registrations",
  recordings: "/recordings",
  feedback: "/feedback",
} as const;

type AuthQueryParams = {
  redirect?: string | null;
  email?: string;
  phone?: string;
  verified?: boolean;
};

import { getAppBaseUrl } from "@/lib/env";
import { isEventRegistrationClosed } from "@/lib/event-registration-window";

/** Only allow same-origin relative paths as post-auth redirects. */
export function sanitizeRedirect(path: string | null | undefined): string | null {
  if (!path) return null;

  if (path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }

  try {
    const url = new URL(path);
    const allowedOrigins = new Set<string>();

    const appBase = getAppBaseUrl();
    if (appBase) allowedOrigins.add(new URL(appBase).origin);
    if (typeof window !== "undefined") {
      allowedOrigins.add(window.location.origin);
    }

    if (allowedOrigins.has(url.origin)) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }

  return null;
}

export function buildAuthUrl(
  route: (typeof ROUTES)[keyof typeof ROUTES],
  params?: AuthQueryParams,
): string {
  const search = new URLSearchParams();
  const redirect = sanitizeRedirect(params?.redirect);
  if (redirect) search.set("redirect", redirect);
  if (params?.email) search.set("email", params.email);
  if (params?.phone) search.set("phone", params.phone);
  if (params?.verified) search.set("verified", "1");
  const qs = search.toString();
  return qs ? `${route}?${qs}` : route;
}

export function getHomeRegisterHref(
  isAuthenticated: boolean,
  isEventRegistered: boolean,
  eventId?: string,
): string {
  if (isEventRegistrationClosed()) {
    return ROUTES.recordings;
  }

  if (!isAuthenticated) {
    const redirect = eventId
      ? `${ROUTES.eventRegister}?event=${eventId}`
      : ROUTES.eventRegister;
    return buildAuthUrl(ROUTES.signup, { redirect });
  }
  if (!isEventRegistered) {
    return eventId ? `${ROUTES.eventRegister}?event=${eventId}` : ROUTES.eventRegister;
  }
  return ROUTES.home;
}

export const PROFILE_SUPPORT_EVENT_KEY = "profile-support-event";

export function buildProfileSupportUrl(eventId?: string, services?: string[]): string {
  if (!eventId) return ROUTES.profile;
  const search = new URLSearchParams({ event: eventId });
  if (services && services.length > 0) {
    search.set("services", services.join(","));
  }
  return `${ROUTES.profile}?${search.toString()}`;
}

export function buildResetPasswordUrl(phone?: string): string {
  if (!phone?.trim()) return ROUTES.resetPassword;
  const digits = phone.replace(/\D/g, "").slice(-10);
  const search = new URLSearchParams({ phone: digits });
  return `${ROUTES.resetPassword}?${search.toString()}`;
}

export function getHomeRegisterLabel(isAuthenticated: boolean, isEventRegistered: boolean): string | null {
  if (isEventRegistrationClosed()) return "Watch Recordings";
  if (!isAuthenticated) return "Register";
  if (!isEventRegistered) return "Register for Event";
  return null;
}
