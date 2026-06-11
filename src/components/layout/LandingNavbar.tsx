"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserInitials } from "@/components/shared/UserInitials";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { isStaffRole } from "@/lib/auth-utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export function LandingNavbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isRegistered } = useEventRegistration();
  const canWatchLive = isAuthenticated && user && (isStaffRole(user.role) || isRegistered);

  const handleLogout = async () => {
    await logout();
    router.push("/");
    setOpen(false);
  };

  const authButtons = isAuthenticated && user ? (
    <>
      {canWatchLive ? (
        <Button variant="outline" asChild>
          <Link href="/streaming">Watch Live</Link>
        </Button>
      ) : (
        <Button variant="outline" disabled title="Register for an event first to watch live">
          Watch Live
        </Button>
      )}
      {isStaffRole(user.role) && (
        <Button asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      )}
      <Button variant="ghost" className="gap-2 px-2" onClick={handleLogout}>
        <UserInitials name={`${user.firstName} ${user.lastName}`} size="sm" />
        <span className="hidden lg:inline text-sm">Logout</span>
      </Button>
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
          <ThemeToggle />
          {authButtons}
        </div>

        <div className="flex md:hidden items-center gap-2">
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
                {canWatchLive ? (
                  <Button variant="outline" asChild>
                    <Link href="/streaming" onClick={() => setOpen(false)}>Watch Live</Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled title="Register for an event first to watch live">
                    Watch Live
                  </Button>
                )}
                {isStaffRole(user.role) && (
                  <Button asChild>
                    <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                  </Button>
                )}
                <Button variant="ghost" onClick={handleLogout}>Logout</Button>
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
