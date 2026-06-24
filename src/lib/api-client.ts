import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
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
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRefreshRequest(originalRequest.url)
    ) {
      originalRequest._retry = true;

      const newToken = await refreshStoredAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
