import { isStaffRole } from "@/lib/auth-utils";
import {
  CHAT_EDIT_WINDOW_MS,
  CHAT_OWNER_DELETE_WINDOW_MS,
} from "@/lib/event-chat-ws";
import type {
  ChatReactionCounts,
  ChatReactionType,
  LiveChatMessage,
  UserRole,
} from "@/types";

const REACTION_TYPES: ChatReactionType[] = ["like", "love", "clap"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export function mapApiLiveChatMessage(raw: unknown): LiveChatMessage | null {
  const row = asRecord(raw);
  if (!row) return null;

  const id = pickString(row.id, row.pk);
  const message = pickString(row.message);
  if (!id || !message) return null;

  return {
    id,
    eventId: pickString(row.event, row.event_id),
    senderId: pickString(row.sender_id, row.senderId, row.sender),
    senderName: pickString(row.sender_name, row.senderName) || "Guest",
    message,
    createdAt: pickString(row.created_at, row.createdAt) || new Date().toISOString(),
    editedAt: nullableString(row.edited_at ?? row.editedAt),
    isDeleted: Boolean(row.is_deleted ?? row.isDeleted),
  };
}

export function mapApiLiveChatMessages(raw: unknown): LiveChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(mapApiLiveChatMessage)
    .filter((item): item is LiveChatMessage => Boolean(item));
}

export function mapApiReactionCounts(raw: unknown): ChatReactionCounts {
  const row = asRecord(raw) ?? {};
  return {
    like: Number(row.like ?? 0) || 0,
    love: Number(row.love ?? 0) || 0,
    clap: Number(row.clap ?? 0) || 0,
  };
}

export function isChatReactionType(value: string): value is ChatReactionType {
  return REACTION_TYPES.includes(value as ChatReactionType);
}

export function canEditLiveChatMessage(
  message: LiveChatMessage,
  userId: string | undefined,
  nowMs = Date.now(),
): boolean {
  if (!userId || message.senderId !== userId || message.isDeleted) return false;
  const created = new Date(message.createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return nowMs - created <= CHAT_EDIT_WINDOW_MS;
}

export function canDeleteLiveChatMessage(
  message: LiveChatMessage,
  userId: string | undefined,
  role: UserRole | undefined,
  nowMs = Date.now(),
): boolean {
  if (message.isDeleted) return false;
  if (role && isStaffRole(role)) return true;
  if (!userId || message.senderId !== userId) return false;
  const created = new Date(message.createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return nowMs - created <= CHAT_OWNER_DELETE_WINDOW_MS;
}

export type EventChatServerMessage =
  | { type: "history"; messages: LiveChatMessage[] }
  | { type: "reaction_counts"; counts: ChatReactionCounts }
  | { type: "message"; message: LiveChatMessage }
  | { type: "message_edited"; message: LiveChatMessage }
  | { type: "message_deleted"; messageId: string }
  | { type: "error"; detail: string }
  | { type: "unknown" };

export function parseEventChatServerMessage(raw: unknown): EventChatServerMessage {
  const row = asRecord(raw);
  if (!row) return { type: "unknown" };

  const type = pickString(row.type);
  switch (type) {
    case "history":
      return { type: "history", messages: mapApiLiveChatMessages(row.messages) };
    case "reaction_counts":
      return { type: "reaction_counts", counts: mapApiReactionCounts(row.counts) };
    case "message": {
      const message = mapApiLiveChatMessage(row.message);
      return message ? { type: "message", message } : { type: "unknown" };
    }
    case "message_edited": {
      const message = mapApiLiveChatMessage(row.message);
      return message ? { type: "message_edited", message } : { type: "unknown" };
    }
    case "message_deleted": {
      const messageId = pickString(row.message_id, row.messageId);
      return messageId
        ? { type: "message_deleted", messageId }
        : { type: "unknown" };
    }
    case "error":
      return {
        type: "error",
        detail: pickString(row.detail, row.message) || "Chat error",
      };
    default:
      return { type: "unknown" };
  }
}
