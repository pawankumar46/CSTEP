"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ClipboardList, Loader2, LogOut, Menu, User, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserInitials } from "@/components/shared/UserInitials";
import { WatchLiveButton } from "@/components/shared/WatchLiveButton";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { isStaffRole } from "@/lib/auth-utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function LandingNavbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout, isLoggingOut } = useAuthStore();
  const { upcomingEvent } = useEventRegistration();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    await logout();
    router.push("/");
    setOpen(false);
  };

  const userMenu = user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-2"
          disabled={isLoggingOut}
          aria-label="Account menu"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserInitials name={`${user.firstName} ${user.lastName}`} size="sm" />
          )}
          <span className="hidden max-w-[8rem] truncate lg:inline text-sm">
            {isLoggingOut ? "Logging out..." : user.firstName || "Account"}
          </span>
          {!isLoggingOut && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={ROUTES.myRegistrations} className="cursor-pointer">
            <ClipboardList className="mr-2 h-4 w-4" />
            My Registrations
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.profile} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.recordings} className="cursor-pointer">
            <Video className="mr-2 h-4 w-4" />
            Recordings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={isLoggingOut}
          onSelect={() => {
            void handleLogout();
          }}
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          {isLoggingOut ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const authButtons = isAuthenticated && user ? (
    <>
      {isStaffRole(user.role) && (
        <Button asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      )}
      {userMenu}
    </>
  ) : (
    <>
      <Button variant="ghost" asChild>
        <Link href={ROUTES.login}>Sign In</Link>
      </Button>
      <Button asChild>
        <Link href={ROUTES.signup}>Sign Up</Link>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <BrandLogo height={40} priority />

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && <NotificationDropdown />}
          <ThemeToggle />
          {authButtons}
        </div>

        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && <NotificationDropdown />}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className={cn("md:hidden border-t", open ? "block" : "hidden")}>
        <nav className="container mx-auto flex flex-col gap-2 p-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            {isAuthenticated && user ? (
              <>
                <WatchLiveButton
                  event={upcomingEvent}
                  size="default"
                  variant="outline"
                  onNavigate={() => setOpen(false)}
                />
                {isStaffRole(user.role) && (
                  <Button asChild>
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href={ROUTES.myRegistrations} onClick={() => setOpen(false)}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    My Registrations
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href={ROUTES.profile} onClick={() => setOpen(false)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href={ROUTES.recordings} onClick={() => setOpen(false)}>
                    <Video className="mr-2 h-4 w-4" />
                    Recordings
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={ROUTES.login}>Sign In</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href={ROUTES.signup}>Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
