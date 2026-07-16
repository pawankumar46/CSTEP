import axios from "axios";
import { apiClient } from "@/lib/api-client";
import {
  clearSessionTokens,
  getAccessToken,
} from "@/lib/auth-session";
import {
  extractApiErrorFromData,
  extractApiErrorMessage,
  extractRefreshToken,
  extractToken,
  mapApiUser,
  normalizeAuthIdentifier,
  toLoginPayload,
  extractUserIdFromSignupResponse,
  toSignupPayload,
  toLobbySignupPayload,
  toOtpLoginPayload,
  toResetPasswordPayload,
  toUpdateProfilePayload,
  toVerifyOtpPayload,
  toResendOtpPayload,
  formatPhoneForApi,
} from "@/lib/auth-mappers";
import type { AuthResponse, LoginCredentials, OtpVerifyMethod, ResetPasswordPayload, SignupCredentials, User, VerifyOtpPayload } from "@/types";

async function fetchCurrentUser(fallbackEmail?: string): Promise<User | null> {
  try {
    const { data } = await apiClient.get<Record<string, unknown>>("/auth/me/");
    return mapApiUser(data, fallbackEmail);
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      return null;
    }
    throw error;
  }
}

export const signUp = async (data: SignupCredentials): Promise<{ success: boolean; userId: string }> => {
  try {
    const { data: response } = await apiClient.post<Record<string, unknown>>(
      "/auth/sign_up/",
      toSignupPayload(data),
    );
    return {
      success: true,
      userId: extractUserIdFromSignupResponse(response),
    };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const signUpLobbyUser = async (
  data: SignupCredentials,
): Promise<{ success: boolean; userId: string }> => {
  try {
    const { data: response } = await apiClient.post<Record<string, unknown>>(
      "/auth/sign_up/",
      toLobbySignupPayload(data),
    );
    return {
      success: true,
      userId: extractUserIdFromSignupResponse(response),
    };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const identifier = normalizeAuthIdentifier(credentials.identifier);

  try {
    const { data } = await apiClient.post<Record<string, unknown>>(
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
      const profile = await fetchCurrentUser(identifier);
      if (profile) {
        user = profile;
      }
    }

    return { user, token, refreshToken };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const requestPhoneOtpLogin = async (phone: string): Promise<{ success: boolean }> => {
  try {
    await apiClient.post("/auth/otp-login/", toOtpLoginPayload(phone));
    return { success: true };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const loginWithPhoneOtp = async (
  phone: string,
  otp: string,
): Promise<AuthResponse> => {
  try {
    const payload = toVerifyOtpPayload("phone", otp, phone);
    const { data } = await apiClient.post<Record<string, unknown>>(
      "/auth/verify-otp/",
      payload,
    );

    const bodyError = extractApiErrorFromData(data);
    if (bodyError) throw new Error(bodyError);

    const token = extractToken(data);
    if (!token) {
      throw new Error("OTP verified but no login token was returned. Please contact support.");
    }

    const refreshToken = extractRefreshToken(data);
    const responseUser = data.user as Record<string, unknown> | undefined;
    let user = mapApiUser(responseUser ?? data, formatPhoneForApi(phone));

    if (!user.firstName || !user.lastName) {
      const profile = await fetchCurrentUser();
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
    await apiClient.post(
      "/auth/verify-otp/",
      toVerifyOtpPayload(payload.method, payload.otp, contact)
    );
    return { success: true };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const resendOtp = async (
  method: OtpVerifyMethod,
  contact: string,
): Promise<{ success: boolean }> => {
  if (!contact.trim()) {
    throw new Error(method === "phone" ? "Phone number is required" : "Email is required");
  }

  try {
    await apiClient.post("/auth/resend-otp/", toResendOtpPayload(method, contact));
    return { success: true };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const forgotPassword = async (phone: string): Promise<{ success: boolean }> => {
  try {
    await apiClient.post("/auth/forgot-password/", {
      phone_number: formatPhoneForApi(phone),
    });
    return { success: true };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const resetPassword = async (payload: ResetPasswordPayload): Promise<{ success: boolean }> => {
  try {
    await apiClient.post("/auth/reset-password/", toResetPasswordPayload(payload));
    return { success: true };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateProfile = async (payload: {
  salutation?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
}): Promise<User> => {
  try {
    const { data } = await apiClient.patch<Record<string, unknown>>(
      "/auth/me/",
      toUpdateProfilePayload(payload),
    );
    return mapApiUser(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (typeof window === "undefined") return null;
  if (!getAccessToken()) return null;

  return fetchCurrentUser();
};

export const clearAuthStorage = (): void => {
  if (typeof window === "undefined") return;
  clearSessionTokens();
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
      await apiClient.post("/auth/logout/", { refresh: refreshToken }, { headers });
    } catch {
      // Clear local session even when server logout fails
    }
  }

  clearAuthStorage();
};
