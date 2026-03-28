import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { ClientStatus, Prisma } from "@prisma/client";
import {
  PAGE_TITLE, PAGE_SUBTITLE, PAGE_HEADER,
  FIELD_CLASS, SELECT_CLASS, FILTER_BAR,
  TABLE_WRAPPER, TABLE_TH, TABLE_TR, TABLE_TD, TABLE_EMPTY_TD,
  PILL, CLIENT_STATUS_BADGE,
  LINK_SUBTLE,
} from "@/lib/ui-classes";

export const metadata = { title: "Clients — DZC DMS" };

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<ClientStatus, string> = {
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  GRADUATED: "Graduated",
  WITHDRAWN: "Withdrawn",
  DEFAULTED: "Defaulted",
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
      <div className={PAGE_HEADER}>
        <div>
          <h1 className={PAGE_TITLE}>Clients</h1>
          <p className={PAGE_SUBTITLE}>{total} client{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/clients/new" className={buttonVariants()}>
          New Client
        </Link>
      </div>

      {/* Filters */}
      <form method="get" action="/clients" className={FILTER_BAR}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search name, email, phone…"
          className={`${FIELD_CLASS} w-64`}
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className={SELECT_CLASS}
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
      <div className={TABLE_WRAPPER}>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left">
              <th className={TABLE_TH}>Name</th>
              <th className={TABLE_TH}>Contact</th>
              <th className={TABLE_TH}>Status</th>
              <th className={TABLE_TH}>Accounts</th>
              <th className={TABLE_TH}>Handler</th>
              <th className={TABLE_TH}>Enrolled</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className={TABLE_EMPTY_TD}>No clients found.</td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className={TABLE_TR}>
                  <td className={TABLE_TD}>
                    <Link href={`/clients/${c.id}`} className={LINK_SUBTLE}>
                      {c.firstName} {c.lastName}
                    </Link>
                  </td>
                  <td className={`${TABLE_TD} text-muted-foreground`}>
                    <div>{c.email ?? "—"}</div>
                    {c.phone && (
                      <div className="text-xs mt-0.5">{c.phone}</div>
                    )}
                  </td>
                  <td className={TABLE_TD}>
                    <span className={`${PILL} ${CLIENT_STATUS_BADGE[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className={`${TABLE_TD} tabular-nums text-muted-foreground`}>
                    {c._count.debtAccounts}
                  </td>
                  <td className={`${TABLE_TD} text-muted-foreground`}>
                    {c.handler?.name ?? "—"}
                  </td>
                  <td className={`${TABLE_TD} text-muted-foreground`}>
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
