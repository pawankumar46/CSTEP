"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Loader2,
  Pencil,
  Reply,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  canDeleteLiveChatMessage,
  canEditLiveChatMessage,
} from "@/lib/event-chat-mappers";
import { CHAT_MAX_MESSAGE_LENGTH } from "@/lib/event-chat-ws";
import { cn } from "@/lib/utils";
import { useEventChatSocket } from "@/hooks/useEventChatSocket";
import type { ChatReactionType, LiveChatMessage, UserRole } from "@/types";

const REACTIONS: { type: ChatReactionType; label: string; emoji: string }[] = [
  { type: "like", label: "Like", emoji: "👍" },
  { type: "love", label: "Love", emoji: "❤️" },
  { type: "laugh", label: "Laugh", emoji: "😂" },
  { type: "wow", label: "Wow", emoji: "😮" },
  { type: "sad", label: "Sad", emoji: "😢" },
  { type: "angry", label: "Angry", emoji: "😠" },
];

interface LiveChatPanelProps {
  eventId: string | null | undefined;
  userId?: string;
  userRole?: UserRole;
  className?: string;
}

function formatChatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function LiveChatPanel({
  eventId,
  userId,
  userRole,
  className,
}: LiveChatPanelProps) {
  const {
    status,
    messages,
    error,
    clearError,
    sendMessage,
    editMessage,
    deleteMessage,
    sendReaction,
  } = useEventChatSocket(eventId);

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const connected = status === "connected";
  const connecting = status === "connecting";
  const replyingTo =
    messages.find((message) => message.id === replyingToId) ?? null;

  const handleSend = () => {
    if (!connected) return;
    if (sendMessage(draft, replyingToId ?? undefined)) {
      setDraft("");
      setReplyingToId(null);
    }
  };

  const startEdit = (message: LiveChatMessage) => {
    setEditingId(message.id);
    setEditDraft(message.message);
    clearError();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (editMessage(editingId, editDraft)) {
      cancelEdit();
    }
  };

  return (
    <Card className={cn("flex h-full flex-col overflow-hidden", className)}>
      <CardHeader className="shrink-0 pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            Live Chat
            {connecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="Connecting" />
            ) : (
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  connected ? "bg-emerald-500" : "bg-muted-foreground/50",
                )}
                title={connected ? "Connected" : "Disconnected"}
              />
            )}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pb-4">
        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-2 pr-1"
          aria-live="polite"
        >
          {!eventId ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Chat will connect when an event is available.
            </p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {connecting ? "Connecting to chat…" : "No messages yet. Say hello!"}
            </p>
          ) : (
            messages.map((msg) => {
              const isOwn = Boolean(userId && msg.senderId === userId);
              const canEdit = canEditLiveChatMessage(msg, userId, nowMs);
              const canDelete = canDeleteLiveChatMessage(msg, userId, userRole, nowMs);
              const isEditing = editingId === msg.id;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group text-sm leading-snug rounded-md px-1.5 py-1 -mx-1.5 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-medium text-primary">{msg.senderName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatChatTime(msg.createdAt)}
                          {msg.editedAt ? " · edited" : ""}
                        </span>
                      </div>

                      {msg.replyTo && (
                        <div className="my-1.5 border-l-2 border-primary/40 bg-muted/40 px-2 py-1 text-xs">
                          <p className="font-medium text-primary/80">
                            {msg.replyTo.senderName}
                          </p>
                          <p className="line-clamp-2 text-muted-foreground">
                            {msg.replyTo.isDeleted
                              ? "This message was deleted"
                              : msg.replyTo.message}
                          </p>
                        </div>
                      )}

                      {msg.isDeleted ? (
                        <p className="italic text-muted-foreground">
                          This message was deleted
                        </p>
                      ) : isEditing ? (
                        <div className="mt-1.5 flex gap-1.5">
                          <Input
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value.slice(0, CHAT_MAX_MESSAGE_LENGTH))}
                            className="h-8 text-sm"
                            maxLength={CHAT_MAX_MESSAGE_LENGTH}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                          />
                          <Button size="icon" className="h-8 w-8 shrink-0" onClick={saveEdit} aria-label="Save edit">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={cancelEdit}
                            aria-label="Cancel edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <p className="break-words">{msg.message}</p>
                      )}
                    </div>

                    {!isEditing &&
                      !msg.isDeleted &&
                      (connected || canEdit || canDelete) && (
                      <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {connected && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setReplyingToId(msg.id);
                              clearError();
                            }}
                            aria-label="Reply to message"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => startEdit(msg)}
                            aria-label={isOwn ? "Edit your message" : "Edit message"}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteMessage(msg.id)}
                            aria-label="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {!msg.isDeleted && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {REACTIONS.map((reaction) => {
                        const summary = msg.reactions.find(
                          (item) => item.reaction === reaction.type,
                        );
                        const active = Boolean(
                          userId && summary?.senderIds.includes(userId),
                        );
                        return (
                          <button
                            key={reaction.type}
                            type="button"
                            disabled={!connected}
                            onClick={() =>
                              sendReaction(msg.id, reaction.type)
                            }
                            aria-label={`${reaction.label} reaction`}
                            aria-pressed={active}
                            className={cn(
                              "inline-flex h-6 items-center gap-1 rounded-full border px-1.5 text-[11px] transition-colors",
                              active
                                ? "border-primary/50 bg-primary/10 text-primary"
                                : "border-transparent text-muted-foreground hover:border-border hover:bg-muted",
                              !summary?.count && "sm:opacity-0 sm:group-hover:opacity-100",
                            )}
                          >
                            <span aria-hidden>{reaction.emoji}</span>
                            {summary?.count ? (
                              <span>{summary.count}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {error && (
          <div className="flex shrink-0 items-start justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2">
            <p className="text-xs text-destructive">{error}</p>
            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={clearError} aria-label="Dismiss error">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {replyingTo && (
          <div className="flex shrink-0 items-start justify-between gap-2 rounded-md border-l-2 border-primary bg-muted/50 px-2.5 py-2">
            <div className="min-w-0 text-xs">
              <p className="font-medium text-primary">
                Replying to {replyingTo.senderName}
              </p>
              <p className="truncate text-muted-foreground">
                {replyingTo.isDeleted
                  ? "This message was deleted"
                  : replyingTo.message}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={() => setReplyingToId(null)}
              aria-label="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div className="flex shrink-0 gap-2 pt-0.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, CHAT_MAX_MESSAGE_LENGTH))}
            placeholder={connected ? "Type a message..." : "Connecting to chat…"}
            disabled={!connected}
            maxLength={CHAT_MAX_MESSAGE_LENGTH}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!connected || !draft.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
