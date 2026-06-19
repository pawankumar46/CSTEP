"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, BarChart3, Video, MessageSquare,
  Settings, UserCog, ChevronLeft, ChevronRight, Home, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LOBBY_NAV_PATHS, NAV_ITEMS, type NavItem } from "@/lib/constants";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, LayoutDashboard, Calendar, Users, BarChart3, Video, MessageSquare,
  Settings, UserCog,
};

function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

function isLobbySectionActive(pathname: string): boolean {
  return LOBBY_NAV_PATHS.some((href) => isPathActive(pathname, href));
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [lobbyExpanded, setLobbyExpanded] = useState(() => isLobbySectionActive(pathname));

  useEffect(() => {
    if (isLobbySectionActive(pathname)) {
      setLobbyExpanded(true);
    }
  }, [pathname]);

  const navItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    );

  const childLinkClass = (active: boolean) =>
    cn(
      "flex items-center rounded-lg py-2 pl-9 pr-3 text-sm transition-colors",
      active
        ? "bg-primary/10 font-medium text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    );

  const renderNavItem = (item: NavItem) => {
    const Icon = iconMap[item.icon];

    if (item.children?.length) {
      const sectionActive = isLobbySectionActive(pathname);

      if (collapsed) {
        return (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-center rounded-lg p-2.5 transition-colors",
                  sectionActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                title={item.label}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-48">
              {item.children.map((child) => (
                <DropdownMenuItem key={child.href} asChild>
                  <Link
                    href={child.href}
                    className={cn(
                      "cursor-pointer",
                      isPathActive(pathname, child.href) && "bg-accent font-medium",
                    )}
                  >
                    {child.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }

      return (
        <div key={item.label} className="space-y-1">
          <button
            type="button"
            onClick={() => setLobbyExpanded((open) => !open)}
            className={cn(linkClass(sectionActive), "w-full justify-between")}
          >
            <span className="flex items-center gap-3">
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span>{item.label}</span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                lobbyExpanded && "rotate-180",
              )}
            />
          </button>
          {lobbyExpanded && (
            <div className="space-y-0.5">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={childLinkClass(isPathActive(pathname, child.href))}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (!item.href) return null;

    const isActive = isPathActive(pathname, item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={linkClass(isActive)}
        title={collapsed ? item.label : undefined}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex border-b",
          collapsed
            ? "h-auto flex-col items-center gap-2 px-2 py-3"
            : "h-16 items-center justify-between px-4",
        )}
      >
        <BrandLogo
          href="/dashboard"
          height={collapsed ? 24 : 34}
          imageClassName={collapsed ? "max-w-[3.25rem]" : undefined}
          className={collapsed ? "w-full justify-center" : undefined}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={collapsed ? "h-8 w-8" : ""}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map(renderNavItem)}
      </nav>
    </aside>
  );
}
