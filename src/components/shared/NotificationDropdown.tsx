"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockNotifications as initialNotifications } from "@/mock/feedback";
import { formatDateTime } from "@/lib/utils";

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No notifications</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="relative flex flex-col items-start gap-1 px-2 py-3 hover:bg-accent rounded-sm"
            >
              <button
                type="button"
                onClick={() => dismissNotification(notif.id)}
                className="absolute top-2 right-2 rounded-sm p-0.5 text-muted-foreground opacity-60 transition-opacity hover:opacity-100 hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-2 w-full pr-5">
                <span className="font-medium text-sm">{notif.title}</span>
                {!notif.read && <span className="h-2 w-2 rounded-full bg-primary ml-auto" />}
              </div>
              <span className="text-xs text-muted-foreground pr-5">{notif.message}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(notif.createdAt)}</span>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
