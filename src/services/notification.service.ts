import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import { isStaffRole } from "@/lib/auth-utils";
import { ROUTES } from "@/lib/routes";
import type {
  ApiMarkAllReadResult,
  ApiNotification,
  ApiNotificationType,
  ApiUnreadCount,
} from "@/lib/notification-api-contract";
import type { Notification, UserRole } from "@/types";

const NOTIFICATIONS_BASE = "/notification/notification";

function severityForType(
  type: ApiNotificationType | string,
): Notification["type"] {
  switch (type) {
    case "REGISTRATION_CONFIRMED":
    case "BROADCAST_LIVE":
      return "success";
    case "REGISTRATION_STATUS_UPDATE":
    case "ASSISTANCE_STATUS_UPDATE":
      return "warning";
    case "EVENT_REMINDER":
      return "info";
    default:
      return "info";
  }
}

function hrefForNotification(
  type: ApiNotificationType | string,
  role?: UserRole,
): string | undefined {
  const staff = role ? isStaffRole(role) : false;
  switch (type) {
    case "REGISTRATION_CONFIRMED":
    case "REGISTRATION_STATUS_UPDATE":
      return staff ? "/dashboard/lobby" : ROUTES.myRegistrations;
    case "ASSISTANCE_STATUS_UPDATE":
      return staff ? "/dashboard/travel" : ROUTES.profile;
    case "BROADCAST_LIVE":
      return ROUTES.streaming;
    case "EVENT_REMINDER":
      return ROUTES.home;
    default:
      return undefined;
  }
}

export function mapApiNotification(
  raw: ApiNotification,
  role?: UserRole,
): Notification {
  const notificationType = String(raw.notification_type ?? "GENERAL");
  return {
    id: String(raw.id),
    notificationType,
    title: String(raw.title || notificationType),
    message: String(raw.body ?? ""),
    type: severityForType(notificationType),
    read: Boolean(raw.is_read),
    createdAt: String(raw.created_at ?? new Date().toISOString()),
    eventId: raw.event == null ? null : String(raw.event),
    href: hrefForNotification(notificationType, role),
  };
}

function extractNotificationList(data: unknown): ApiNotification[] {
  if (Array.isArray(data)) return data as ApiNotification[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: ApiNotification[] }).results;
  }
  return [];
}

export const getNotifications = async (
  opts?: { unreadOnly?: boolean; role?: UserRole },
): Promise<Notification[]> => {
  try {
    const { data } = await apiClient.get<unknown>(`${NOTIFICATIONS_BASE}/`, {
      params: opts?.unreadOnly ? { unread: true } : undefined,
    });
    return extractNotificationList(data).map((item) =>
      mapApiNotification(item, opts?.role),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const { data } = await apiClient.get<ApiUnreadCount>(
      `${NOTIFICATIONS_BASE}/unread-count/`,
    );
    return Number(data.unread_count ?? 0);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const markNotificationRead = async (
  id: string,
  role?: UserRole,
): Promise<Notification> => {
  try {
    const { data } = await apiClient.post<ApiNotification>(
      `${NOTIFICATIONS_BASE}/${encodeURIComponent(id)}/read/`,
    );
    return mapApiNotification(data, role);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const markAllNotificationsRead = async (): Promise<number> => {
  try {
    const { data } = await apiClient.post<ApiMarkAllReadResult>(
      `${NOTIFICATIONS_BASE}/read-all/`,
    );
    return Number(data.marked_read ?? 0);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export function mapIncomingNotification(
  raw: unknown,
  role?: UserRole,
): Notification | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<ApiNotification>;
  if (row.id == null) return null;
  return mapApiNotification(
    {
      id: Number(row.id),
      notification_type: String(row.notification_type ?? "GENERAL"),
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      is_read: Boolean(row.is_read),
      event: row.event ?? null,
      created_at: String(row.created_at ?? new Date().toISOString()),
    },
    role,
  );
}
