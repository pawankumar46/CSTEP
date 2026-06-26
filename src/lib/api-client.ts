import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "@/lib/auth-session";
import { getApiBaseUrl } from "@/lib/env";
import {
  isAuthRefreshRequest,
  refreshStoredAccessToken,
} from "@/lib/auth-token";

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else if (config.headers.has("Authorization")) {
    config.headers.delete("Authorization");
  }
  return config;
});

function shouldRetryWithRefresh(error: AxiosError): boolean {
  const status = error.response?.status;
  if (status !== 401 && status !== 403) return false;

  const url = error.config?.url ?? "";
  if (isAuthRefreshRequest(url)) return false;

  return Boolean(getAccessToken() || error.config?.headers?.Authorization);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (originalRequest && !originalRequest._retry && shouldRetryWithRefresh(error)) {
      originalRequest._retry = true;

      const newToken = await refreshStoredAccessToken();
      if (newToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
