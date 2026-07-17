import axios from "axios";
import { getAccessToken } from "@/lib/auth-session";
import {
  forceSessionExpiredRedirect,
  shouldForceLoginOnAuthError,
} from "@/lib/auth-session-expired";
import { getApiBaseUrl } from "@/lib/env";

export const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  // Always resolve from env at request time so auth never hits the page origin (localhost).
  const baseURL = getApiBaseUrl();
  config.baseURL = baseURL;

  // Absolute request URLs ignore baseURL — keep relative paths so Django host is used.
  if (typeof config.url === "string" && /^https?:\/\//i.test(config.url)) {
    try {
      const requested = new URL(config.url);
      const apiOrigin = new URL(baseURL).origin;
      if (requested.origin !== apiOrigin) {
        config.url = `${requested.pathname}${requested.search}`;
      }
    } catch {
      // leave url as-is if parsing fails
    }
  }

  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else if (config.headers.has("Authorization")) {
    config.headers.delete("Authorization");
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url;

    if (shouldForceLoginOnAuthError(error, requestUrl)) {
      await forceSessionExpiredRedirect();
    }

    return Promise.reject(error);
  },
);
