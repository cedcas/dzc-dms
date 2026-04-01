"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Session } from "next-auth";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Building2,
  BarChart2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/creditors", label: "Creditors", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/help", label: "Help", icon: BookOpen },
];

function AppFooter() {
  return (
    <footer className="border-t bg-background py-3 px-6 flex items-center justify-center">
      <p className="text-xs text-muted-foreground">
        Powered by{" "}
        <a
          href="https://netcoresolutions.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          NetCoreSolutions.com
        </a>
      </p>
    </footer>
  );
}

export function AppShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const activeItem = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const role = session.user.role;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar — dark navy, hidden on mobile */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 flex-col transition-all duration-200",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo area */}
        <div
          className={cn(
            "border-b border-sidebar-border flex items-center min-h-[56px]",
            collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
          )}
        >
          <Logo variant={collapsed ? "icon" : "compact"} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "gap-2.5",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user + sign out + collapse toggle */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          {!collapsed && (
            <p className="text-xs text-sidebar-foreground/55 truncate px-1">
              {session.user?.name}
            </p>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              title={collapsed ? "Sign out" : undefined}
              className={cn(
                "w-full flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed ? "justify-center" : "gap-2"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign out</span>}
            </button>
          </form>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="w-full flex items-center justify-center rounded-lg p-1.5 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Right column: header + content + footer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 border-b bg-card flex items-center px-6 shrink-0 gap-4 shadow-sm">
          {/* Mobile: compact logo; desktop: active page title */}
          <div className="lg:hidden">
            <Logo variant="compact" />
          </div>
          <span className="text-sm font-semibold text-foreground hidden lg:block">
            {activeItem?.label ?? ""}
          </span>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground hidden sm:block">
            {session.user?.name}
          </span>
          {role && (
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium uppercase tracking-wide">
              {role.replace("_", " ").toLowerCase()}
            </span>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>

        {/* Global footer */}
        <AppFooter />
      </div>
    </div>
  );
}
