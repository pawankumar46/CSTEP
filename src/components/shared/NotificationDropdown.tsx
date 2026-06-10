"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockNotifications } from "@/mock/feedback";
import { formatDateTime } from "@/lib/utils";

export function NotificationDropdown() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

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
        {mockNotifications.map((notif) => (
          <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 py-3">
            <div className="flex items-center gap-2 w-full">
              <span className="font-medium text-sm">{notif.title}</span>
              {!notif.read && <span className="h-2 w-2 rounded-full bg-primary ml-auto" />}
            </div>
            <span className="text-xs text-muted-foreground">{notif.message}</span>
            <span className="text-xs text-muted-foreground">{formatDateTime(notif.createdAt)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
