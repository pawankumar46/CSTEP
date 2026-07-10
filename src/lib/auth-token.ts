import axios from "axios";
import { getApiBaseUrl } from "@/lib/env";
import { extractRefreshToken, extractToken } from "@/lib/auth-mappers";
import {
  getAccessToken,
  getRefreshToken,
  notifySessionRefreshed,
  setSessionTokens,
} from "@/lib/auth-session";

const LAST_REFRESH_AT_KEY = "auth_last_refresh_at";

/** Refresh access token proactively before the 30-minute expiry. */
export const ACCESS_TOKEN_REFRESH_INTERVAL_MS = 25 * 60 * 1000;

async function getAuthStore() {
  const { useAuthStore } = await import("@/store/useAuthStore");
  return useAuthStore;
}

function readLastRefreshAt(): number {
  if (typeof window === "undefined") return 0;
  const raw = sessionStorage.getItem(LAST_REFRESH_AT_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function markAccessTokenRefreshed(at = Date.now()): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LAST_REFRESH_AT_KEY, String(at));
}

export function clearAccessTokenRefreshSchedule(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LAST_REFRESH_AT_KEY);
}

export function getLastAccessTokenRefreshAt(): number {
  return readLastRefreshAt();
}

export function canRefreshAccessTokenNow(): boolean {
  const lastRefreshAt = readLastRefreshAt();
  if (!lastRefreshAt) return true;
  return Date.now() - lastRefreshAt >= ACCESS_TOKEN_REFRESH_INTERVAL_MS;
}

async function applyTokens(accessToken: string, refreshToken: string | null) {
  setSessionTokens(accessToken, refreshToken ?? undefined);

  const useAuthStore = await getAuthStore();
  useAuthStore.setState((state) => ({
    token: accessToken,
    refreshToken: refreshToken ?? state.refreshToken,
    isAuthenticated: true,
  }));

  markAccessTokenRefreshed();
  notifySessionRefreshed();
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshStoredAccessToken(): Promise<string | null> {
  const useAuthStore = await getAuthStore();
  const refreshToken = useAuthStore.getState().refreshToken ?? getRefreshToken();
  if (!refreshToken) return null;

  if (!canRefreshAccessTokenNow()) {
    return useAuthStore.getState().token ?? getAccessToken();
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data } = await axios.post<Record<string, unknown>>(
          `${getApiBaseUrl()}/auth/token/refresh/`,
          { refresh: refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        const accessToken = extractToken(data);
        if (!accessToken) return null;

        const nextRefresh = extractRefreshToken(data) || refreshToken;
        await applyTokens(accessToken, nextRefresh);
        return accessToken;
      } catch {
        await useAuthStore.getState().logout();
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function isAuthRefreshRequest(url?: string): boolean {
  if (!url) return false;
  return url.includes("/auth/token/refresh/") || url.includes("/auth/login/");
}
