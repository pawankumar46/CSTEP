import axios from "axios";
import { getAccessToken } from "@/lib/auth-session";
import { getApiBaseUrl } from "@/lib/env";

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
