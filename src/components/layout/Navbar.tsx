"use client";

import { useRouter } from "next/navigation";
import { Home, Loader2, LogOut, User, Video } from "lucide-react";
import { SearchBar } from "@/components/shared/SearchBar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { useAuthStore } from "@/store/useAuthStore";
import { UserInitials } from "@/components/shared/UserInitials";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/routes";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export function Navbar({ onSearch }: NavbarProps) {
  const router = useRouter();
  const { user, logout, isLoggingOut } = useAuthStore();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="w-full max-w-md">
        <SearchBar
          value=""
          onChange={(q) => onSearch?.(q)}
          placeholder="Search events, users..."
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationDropdown />
        <ThemeToggle />

        {user && (
          <>
            <RoleBadge role={user.role} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <UserInitials name={`${user.firstName} ${user.lastName}`} size="md" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.firstName} {user.lastName}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(ROUTES.recordings)}>
                  <Video className="mr-2 h-4 w-4" />
                  Recordings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
