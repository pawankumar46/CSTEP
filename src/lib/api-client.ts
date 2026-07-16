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
  // Always resolve from env at request time so login/signup never hit the page origin (localhost).
  config.baseURL = getApiBaseUrl();

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
