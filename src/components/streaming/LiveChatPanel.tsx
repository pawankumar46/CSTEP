"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Heart,
  HandMetal,
  Loader2,
  Pencil,
  Send,
  ThumbsUp,
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

const REACTIONS: { type: ChatReactionType; label: string; emoji: string; icon: typeof ThumbsUp }[] = [
  { type: "like", label: "Like", emoji: "👍", icon: ThumbsUp },
  { type: "love", label: "Love", emoji: "❤️", icon: Heart },
  { type: "clap", label: "Clap", emoji: "👏", icon: HandMetal },
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
    reactionCounts,
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

  const handleSend = () => {
    if (!connected) return;
    if (sendMessage(draft)) {
      setDraft("");
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
          <div className="flex gap-0.5 shrink-0">
            {REACTIONS.map((reaction) => (
              <Button
                key={reaction.type}
                size="sm"
                variant="ghost"
                className="h-7 px-1.5 text-xs"
                disabled={!connected}
                onClick={() => sendReaction(reaction.type)}
                aria-label={reaction.label}
              >
                {reaction.emoji} {reactionCounts[reaction.type] || 0}
              </Button>
            ))}
          </div>
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

                      {isEditing ? (
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

                    {!isEditing && (canEdit || canDelete) && (
                      <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
