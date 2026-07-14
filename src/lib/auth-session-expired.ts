import axios from "axios";
import { clearAccessTokenRefreshSchedule } from "@/lib/auth-token";
import { clearSessionTokens } from "@/lib/auth-session";
import { ROUTES } from "@/lib/routes";

const AUTH_ONLY_PATHS = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.otp,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
];

let handlingExpiredSession = false;

function isPublicAuthRequest(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes("/auth/login/")
    || url.includes("/auth/sign_up/")
    || url.includes("/auth/verify-otp/")
    || url.includes("/auth/resend-otp/")
    || url.includes("/auth/forgot-password/")
    || url.includes("/auth/reset-password/")
    || url.includes("/auth/token/refresh/")
  );
}

function isAuthPagePath(): boolean {
  if (typeof window === "undefined") return false;
  return AUTH_ONLY_PATHS.some((path) => window.location.pathname === path);
}

export function isExpiredAccessTokenError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) {
    return false;
  }

  const data = error.response.data;
  if (!data || typeof data !== "object") return false;

  const record = data as Record<string, unknown>;
  if (record.code === "token_not_valid") return true;

  const detail = String(record.detail ?? "").toLowerCase();
  if (detail.includes("token not valid")) return true;

  const messages = record.messages;
  if (!Array.isArray(messages)) return false;

  return messages.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const message = entry as Record<string, unknown>;
    const tokenType = String(message.token_type ?? message.token_class ?? "").toLowerCase();
    const text = String(message.message ?? "").toLowerCase();
    return tokenType.includes("access") || text.includes("expired");
  });
}

export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

/** 403 from permission denied must not log the user out — only token/auth-related 403s. */
export function isAuthRelatedForbiddenError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) return false;

  const data = error.response.data;
  if (!data || typeof data !== "object") return false;

  const record = data as Record<string, unknown>;
  if (record.code === "token_not_valid") return true;

  const detail = String(record.detail ?? "").toLowerCase();
  if (
    detail.includes("token not valid")
    || detail.includes("token is invalid")
    || detail.includes("token has expired")
    || detail.includes("invalid token")
    || detail.includes("authentication credentials")
    || detail.includes("not authenticated")
  ) {
    return true;
  }

  const messages = record.messages;
  if (!Array.isArray(messages)) return false;

  return messages.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const message = entry as Record<string, unknown>;
    const tokenType = String(message.token_type ?? message.token_class ?? "").toLowerCase();
    const text = String(message.message ?? "").toLowerCase();
    return tokenType.includes("access") || text.includes("expired") || text.includes("invalid");
  });
}

export async function forceSessionExpiredRedirect(): Promise<void> {
  if (typeof window === "undefined" || handlingExpiredSession || isAuthPagePath()) {
    return;
  }

  handlingExpiredSession = true;

  try {
    clearSessionTokens();
    clearAccessTokenRefreshSchedule();
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth-storage");

    const { useAuthStore } = await import("@/store/useAuthStore");
    const { useRegistrationStore } = await import("@/store/useRegistrationStore");

    useRegistrationStore.getState().clearRegistrationSession();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingOut: false,
      error: null,
      hasHydrated: true,
    });
    await useAuthStore.persist.clearStorage();

    const returnPath = `${window.location.pathname}${window.location.search}`;
    const loginUrl = returnPath && returnPath !== ROUTES.home
      ? `${ROUTES.login}?redirect=${encodeURIComponent(returnPath)}`
      : ROUTES.login;

    window.location.replace(loginUrl);
  } finally {
    handlingExpiredSession = false;
  }
}

export function shouldForceLoginOnAuthError(error: unknown, requestUrl?: string): boolean {
  if (isPublicAuthRequest(requestUrl)) return false;
  if (isExpiredAccessTokenError(error)) return true;
  return isAuthRelatedForbiddenError(error);
}
