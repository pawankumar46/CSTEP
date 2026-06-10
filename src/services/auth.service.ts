import axios from "axios";
import {
  extractApiErrorFromData,
  extractApiErrorMessage,
  extractRefreshToken,
  extractToken,
  mapApiUser,
  normalizeAuthIdentifier,
  toLoginPayload,
  toSignupPayload,
  toVerifyOtpPayload,
} from "@/lib/auth-mappers";
import type { AuthResponse, LoginCredentials, SignupCredentials, User, VerifyOtpPayload } from "@/types";

const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

async function fetchCurrentUser(token: string, fallbackEmail?: string): Promise<User | null> {
  try {
    const { data } = await authApi.get<Record<string, unknown>>("/auth/me/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return mapApiUser(data, fallbackEmail);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

export const signUp = async (data: SignupCredentials): Promise<{ success: boolean }> => {
  try {
    await authApi.post("/auth/sign_up/", toSignupPayload(data));
    return { success: true };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const identifier = normalizeAuthIdentifier(credentials.identifier);

  try {
    const { data } = await authApi.post<Record<string, unknown>>(
      "/auth/login/",
      toLoginPayload(identifier, credentials.password)
    );

    const bodyError = extractApiErrorFromData(data);
    if (bodyError) throw new Error(bodyError);

    const token = extractToken(data);
    if (!token) {
      throw new Error("Login succeeded but no token was returned. Please contact support.");
    }

    const refreshToken = extractRefreshToken(data);

    const responseUser = data.user as Record<string, unknown> | undefined;
    let user = mapApiUser(responseUser ?? data, identifier);

    if (!user.firstName || !user.lastName) {
      const profile = await fetchCurrentUser(token, identifier);
      if (profile) {
        user = profile;
      }
    }

    return { user, token, refreshToken };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const verifyOtp = async (payload: VerifyOtpPayload): Promise<{ success: boolean }> => {
  const contact = payload.method === "phone" ? payload.phone : payload.email;
  if (!contact) {
    throw new Error(payload.method === "phone" ? "Phone number is required" : "Email is required");
  }

  try {
    await authApi.post(
      "/auth/verify-otp/",
      toVerifyOtpPayload(payload.method, payload.otp, contact)
    );
    return { success: true };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const forgotPassword = async (email: string): Promise<{ success: boolean }> => {
  try {
    await authApi.post("/auth/forgot_password/", { email: normalizeAuthIdentifier(email) });
    return { success: true };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("auth_token");
  if (!token) return null;

  return fetchCurrentUser(token);
};

export const clearAuthStorage = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_refresh");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("auth-storage");
};

export const logout = async (refreshToken?: string | null, accessToken?: string | null): Promise<void> => {
  if (refreshToken) {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      await authApi.post("/auth/logout/", { refresh: refreshToken }, { headers });
    } catch {
      // Clear local session even when server logout fails
    }
  }

  clearAuthStorage();
};
