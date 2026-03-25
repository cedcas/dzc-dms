"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/tasks", label: "Tasks" },
  { href: "/creditors", label: "Creditors" },
  { href: "/reports", label: "Reports" },
];

export function AppShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const role = (session.user as { role?: string })?.role;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-56 shrink-0 border-r bg-muted/30 flex-col">
        <div className="px-4 py-5 border-b">
          <span className="text-sm font-semibold tracking-wide">DZC DMS</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t">
          <p className="text-xs text-muted-foreground truncate px-1 mb-2">
            {session.user?.name}
          </p>
          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="w-full justify-start text-muted-foreground"
            >
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Right column: header + content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 border-b bg-background flex items-center px-6 shrink-0 gap-4">
          <span className="text-sm font-semibold lg:hidden">DZC DMS</span>
          <span className="text-sm font-medium text-muted-foreground hidden lg:block">
            {activeItem?.label ?? ""}
          </span>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground hidden sm:block">
            {session.user?.name}
          </span>
          {role && (
            <span className="text-xs bg-muted rounded px-2 py-0.5 text-muted-foreground uppercase tracking-wide">
              {role.replace("_", " ").toLowerCase()}
            </span>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
