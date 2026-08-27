import { isStaffRole } from "@/lib/auth-utils";
import {
  CHAT_EDIT_WINDOW_MS,
  CHAT_OWNER_DELETE_WINDOW_MS,
} from "@/lib/event-chat-ws";
import type {
  ChatReactionType,
  LiveChatMessage,
  LiveChatReaction,
  LiveChatReplyPreview,
  UserRole,
} from "@/types";

const REACTION_TYPES: ChatReactionType[] = [
  "like",
  "love",
  "laugh",
  "wow",
  "sad",
  "angry",
];

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

function mapReplyPreview(raw: unknown): LiveChatReplyPreview | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = pickString(row.id);
  if (!id) return null;
  return {
    id,
    senderId: pickString(row.sender, row.sender_id),
    senderName: pickString(row.sender_name) || "Guest",
    message: pickString(row.message),
    isDeleted: Boolean(row.is_deleted),
  };
}

export function isChatReactionType(value: string): value is ChatReactionType {
  return REACTION_TYPES.includes(value as ChatReactionType);
}

export function mapApiChatReactions(raw: unknown): LiveChatReaction[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const row = asRecord(item);
    const reaction = pickString(row?.reaction);
    if (!row || !isChatReactionType(reaction)) return [];
    const senderIds = Array.isArray(row.sender_ids)
      ? row.sender_ids.map((id) => String(id))
      : [];
    return [{
      reaction,
      count: Number(row.count ?? senderIds.length) || 0,
      senderIds,
    }];
  });
}

export function mapApiLiveChatMessage(raw: unknown): LiveChatMessage | null {
  const row = asRecord(raw);
  if (!row) return null;

  const id = pickString(row.id, row.pk);
  if (!id) return null;

  return {
    id,
    eventId: pickString(row.event, row.event_id),
    senderId: pickString(row.sender_id, row.senderId, row.sender),
    senderName: pickString(row.sender_name, row.senderName) || "Guest",
    message: pickString(row.message),
    createdAt:
      pickString(row.created_at, row.createdAt) || new Date().toISOString(),
    editedAt: nullableString(row.edited_at ?? row.editedAt),
    isDeleted: Boolean(row.is_deleted ?? row.isDeleted),
    replyTo: mapReplyPreview(row.reply_to ?? row.replyTo),
    reactions: mapApiChatReactions(row.reactions),
  };
}

export function mapApiLiveChatMessages(raw: unknown): LiveChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(mapApiLiveChatMessage)
    .filter((item): item is LiveChatMessage => Boolean(item));
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
  | { type: "message"; message: LiveChatMessage }
  | { type: "message_edited"; message: LiveChatMessage }
  | {
      type: "reaction_update";
      messageId: string;
      reactions: LiveChatReaction[];
    }
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
    case "message": {
      const message = mapApiLiveChatMessage(row.message);
      return message ? { type: "message", message } : { type: "unknown" };
    }
    case "message_edited": {
      const message = mapApiLiveChatMessage(row.message);
      return message ? { type: "message_edited", message } : { type: "unknown" };
    }
    case "reaction_update": {
      const messageId = pickString(row.message_id, row.messageId);
      return messageId
        ? {
            type: "reaction_update",
            messageId,
            reactions: mapApiChatReactions(row.reactions),
          }
        : { type: "unknown" };
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
