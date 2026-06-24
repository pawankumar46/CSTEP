import axios from "axios";
import { mapApiRoleToAppRole } from "@/lib/user-roles";
import type { SignupCredentials, User } from "@/types";

export function normalizeAuthIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export function formatPhoneForApi(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return trimmed;
}

export function toVerifyOtpPayload(method: "phone" | "email", otp: string, contact: string) {
  if (method === "phone") {
    return { phone_number: formatPhoneForApi(contact), otp };
  }
  return { email: normalizeAuthIdentifier(contact), otp };
}

export function toSignupPayload(data: SignupCredentials) {
  return {
    salutation: data.salutation,
    first_name: data.firstName,
    middle_name: data.middleName ?? "",
    last_name: data.lastName,
    phone_number: formatPhoneForApi(data.phone),
    email: normalizeAuthIdentifier(data.email),
    password: data.password,
  };
}

export function toLoginPayload(identifier: string, password: string) {
  return {
    username: normalizeAuthIdentifier(identifier),
    password,
  };
}

export function mapApiUser(raw: Record<string, unknown>, fallbackEmail?: string): User {
  const roleKey = String(raw.role ?? "BASE_USER");
  const now = new Date().toISOString();

  return {
    id: String(raw.id ?? raw.pk ?? raw.user_id ?? fallbackEmail ?? "user"),
    salutation: raw.salutation ? String(raw.salutation) : undefined,
    firstName: String(raw.first_name ?? raw.firstName ?? ""),
    middleName: raw.middle_name || raw.middleName ? String(raw.middle_name ?? raw.middleName) : undefined,
    lastName: String(raw.last_name ?? raw.lastName ?? ""),
    email: String(raw.email ?? fallbackEmail ?? ""),
    phone: String(raw.phone_number ?? raw.phone ?? ""),
    role: mapApiRoleToAppRole(roleKey),
    status: (raw.status as User["status"]) ?? "active",
    createdAt: String(raw.created_at ?? raw.createdAt ?? now),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? now),
  };
}

export function extractToken(data: Record<string, unknown>): string {
  const tokens = data.tokens as Record<string, unknown> | undefined;
  const token =
    data.access ??
    data.token ??
    data.access_token ??
    data.key ??
    tokens?.access ??
    tokens?.token;

  if (!token || token === "null" || token === "undefined") {
    return "";
  }

  return String(token);
}

export function extractRefreshToken(data: Record<string, unknown>): string {
  const tokens = data.tokens as Record<string, unknown> | undefined;
  const refresh =
    data.refresh ??
    data.refresh_token ??
    tokens?.refresh ??
    tokens?.refresh_token;

  if (!refresh || refresh === "null" || refresh === "undefined") {
    return "";
  }

  return String(refresh);
}

const SUCCESS_RESPONSE_KEYS = new Set([
  "message",
  "success",
  "access",
  "refresh",
  "token",
  "user",
  "data",
]);

export function extractApiErrorFromData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;

  if (Array.isArray(record.non_field_errors) && record.non_field_errors[0]) {
    return String(record.non_field_errors[0]);
  }

  if (record.detail && typeof record.detail === "string") {
    return record.detail;
  }

  for (const [key, value] of Object.entries(record)) {
    if (SUCCESS_RESPONSE_KEYS.has(key)) continue;
    if (Array.isArray(value) && value[0]) return String(value[0]);
  }

  return null;
}

export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const bodyError = extractApiErrorFromData(data);
    if (bodyError) return bodyError;

    if (data && typeof data === "object" && "message" in data) {
      const message = String((data as Record<string, unknown>).message);
      if (message) return message;
    }

    if (typeof data === "string" && data) {
      if (data.trimStart().startsWith("<!DOCTYPE") || data.trimStart().startsWith("<html")) {
        return error.response?.status === 404
          ? "API endpoint not found. Please check NEXT_PUBLIC_API_URL."
          : "Unable to reach the server. Please try again.";
      }
      return data;
    }
    if (error.message && !error.message.startsWith("Request failed with status")) {
      return error.message;
    }

    return error.response?.status === 401 || error.response?.status === 400
      ? "Invalid email or password"
      : "Unable to sign in. Please try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to sign in. Please try again.";
}
