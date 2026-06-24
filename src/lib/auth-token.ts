import axios from "axios";
import { getApiBaseUrl } from "@/lib/env";
import { extractRefreshToken, extractToken } from "@/lib/auth-mappers";

async function getAuthStore() {
  const { useAuthStore } = await import("@/store/useAuthStore");
  return useAuthStore;
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;

  const refreshFromStorage = localStorage.getItem("auth_refresh");
  if (refreshFromStorage) return refreshFromStorage;

  return null;
}

async function applyTokens(accessToken: string, refreshToken: string | null) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("auth_refresh", refreshToken);
    }
  }

  const useAuthStore = await getAuthStore();
  useAuthStore.setState((state) => ({
    token: accessToken,
    refreshToken: refreshToken ?? state.refreshToken,
    isAuthenticated: true,
  }));
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshStoredAccessToken(): Promise<string | null> {
  const useAuthStore = await getAuthStore();
  const refreshToken = useAuthStore.getState().refreshToken ?? getStoredRefreshToken();
  if (!refreshToken) return null;

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

/** Refresh access token proactively before the 30-minute expiry. */
export const ACCESS_TOKEN_REFRESH_INTERVAL_MS = 25 * 60 * 1000;
