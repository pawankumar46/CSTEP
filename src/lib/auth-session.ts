const REFRESH_STORAGE_KEY = "auth_refresh";

/** In-memory access token — updated synchronously on refresh before any await. */
let memoryAccessToken: string | null = null;

function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function readStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_STORAGE_KEY);
}

/** Hydrate in-memory token from storage (call once on app init). */
export function hydrateAccessTokenFromStorage(): void {
  memoryAccessToken = readStoredAccessToken();
}

/** Latest access token for API requests — memory first, then localStorage. */
export function getAccessToken(): string | null {
  if (memoryAccessToken) return memoryAccessToken;
  const stored = readStoredAccessToken();
  if (stored) memoryAccessToken = stored;
  return stored;
}

export function getRefreshToken(): string | null {
  return readStoredRefreshToken();
}

/** Synchronously persist tokens so the next API call uses the new access token. */
export function setSessionTokens(accessToken: string, refreshToken?: string | null): void {
  memoryAccessToken = accessToken;
  if (typeof window === "undefined") return;

  localStorage.setItem("auth_token", accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
  }
}

export function clearSessionTokens(): void {
  memoryAccessToken = null;
  if (typeof window === "undefined") return;

  localStorage.removeItem("auth_token");
  localStorage.removeItem(REFRESH_STORAGE_KEY);
}

export const AUTH_SESSION_REFRESHED_EVENT = "auth:session-refreshed";

export function notifySessionRefreshed(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_REFRESHED_EVENT));
}
