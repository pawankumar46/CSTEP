"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatUserFullName } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

interface PaginatedUserSelectProps {
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function PaginatedUserSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a user",
}: PaginatedUserSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const {
    userOptions,
    isLoadingUserOptions,
    isLoadingMoreUserOptions,
    userOptionsHasMore,
    fetchUserOptions,
    loadMoreUserOptions,
    resetUserOptions,
  } = useUserStore();

  useEffect(() => {
    if (!open) return;
    const timeoutId = window.setTimeout(() => {
      void fetchUserOptions(search);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [open, search, fetchUserOptions]);

  const displayLabel = useMemo(() => {
    if (!value) return null;
    if (selectedLabel) return selectedLabel;
    const match = userOptions.find((user) => user.id === value);
    return match ? formatUserFullName(match) : null;
  }, [selectedLabel, userOptions, value]);

  useEffect(() => {
    if (!value) {
      setSelectedLabel(null);
    }
  }, [value]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const element = event.currentTarget;
      const nearBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight < 48;

      if (nearBottom && userOptionsHasMore && !isLoadingMoreUserOptions) {
        void loadMoreUserOptions();
      }
    },
    [isLoadingMoreUserOptions, loadMoreUserOptions, userOptionsHasMore],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
      resetUserOptions();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          {isLoadingUserOptions && !value ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </span>
          ) : (
            displayLabel ?? placeholder
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] p-2"
        align="start"
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name..."
          className="mb-2 h-8"
          onKeyDown={(event) => event.stopPropagation()}
        />
        <div
          className="max-h-56 overflow-y-auto"
          onScroll={handleScroll}
        >
          {isLoadingUserOptions && userOptions.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : userOptions.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No users found.</p>
          ) : (
            userOptions.map((user) => (
              <DropdownMenuItem
                key={user.id}
                className="flex items-center justify-between"
                onSelect={() => {
                  onChange(user.id);
                  setSelectedLabel(formatUserFullName(user));
                  setOpen(false);
                }}
              >
                <span>{formatUserFullName(user)}</span>
                {value === user.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))
          )}
          {isLoadingMoreUserOptions && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading more...
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
