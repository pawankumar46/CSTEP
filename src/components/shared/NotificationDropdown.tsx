"use client";

import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, formatDateTime } from "@/lib/utils";

export function NotificationDropdown() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications(isAuthenticated);

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => void markAllRead()}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-80 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            notifications.map((notif) => {
              const body = (
                <>
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-sm">{notif.title}</span>
                    {!notif.read && (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{notif.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(notif.createdAt)}
                  </span>
                </>
              );

              return (
                <div
                  key={notif.id}
                  className={cn(
                    "flex flex-col items-start gap-1 border-b border-border/60 px-3 py-3 last:border-0",
                    !notif.read && "bg-primary/5",
                  )}
                >
                  {notif.href ? (
                    <Link
                      href={notif.href}
                      className="flex w-full flex-col items-start gap-1 rounded-sm hover:opacity-90"
                      onClick={() => {
                        if (!notif.read) void markRead(notif.id);
                      }}
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-1 text-left"
                      onClick={() => {
                        if (!notif.read) void markRead(notif.id);
                      }}
                    >
                      {body}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
