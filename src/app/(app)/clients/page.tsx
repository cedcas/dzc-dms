import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { ClientStatus, Prisma } from "@prisma/client";

export const metadata = { title: "Clients — DZC DMS" };

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<ClientStatus, string> = {
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  GRADUATED: "Graduated",
  WITHDRAWN: "Withdrawn",
  DEFAULTED: "Defaulted",
};

const STATUS_BADGE: Record<ClientStatus, string> = {
  ONBOARDING: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  GRADUATED: "bg-purple-100 text-purple-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
  DEFAULTED: "bg-red-100 text-red-700",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAuth();

  const { q = "", status, page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.ClientWhereInput = {};

  if (q.trim()) {
    where.OR = [
      { firstName: { contains: q.trim() } },
      { lastName: { contains: q.trim() } },
      { email: { contains: q.trim() } },
      { phone: { contains: q.trim() } },
    ];
  }

  const isValidStatus = (s: string): s is ClientStatus =>
    Object.keys(STATUS_LABEL).includes(s);

  if (status && isValidStatus(status)) {
    where.status = status;
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        enrolledAt: true,
        handler: { select: { name: true } },
        _count: { select: { debtAccounts: true } },
      },
    }),
    prisma.client.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    sp.set("page", String(p));
    return `/clients?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} client{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/clients/new" className={buttonVariants()}>
          New Client
        </Link>
      </div>

      {/* Filters */}
      <form method="get" action="/clients" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search name, email, phone…"
          className="h-8 w-64 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
        {(q || status) && (
          <Link href="/clients" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Contact</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Accounts</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Handler</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Enrolled</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No clients found.
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${c.id}`}
                      className="font-medium hover:underline underline-offset-2"
                    >
                      {c.firstName} {c.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{c.email ?? "—"}</div>
                    {c.phone && (
                      <div className="text-xs mt-0.5">{c.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_BADGE[c.status]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {c._count.debtAccounts}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.handler?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.enrolledAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages} &mdash; {total} results
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageUrl(page + 1)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
