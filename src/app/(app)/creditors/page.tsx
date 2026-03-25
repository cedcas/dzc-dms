import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { CreditorType, ContactChannel, Prisma } from "@prisma/client";

export const metadata = { title: "Creditors — DZC DMS" };

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<CreditorType, string> = {
  ORIGINAL_CREDITOR: "Original Creditor",
  COLLECTION_AGENCY: "Collection Agency",
  LAW_FIRM: "Law Firm",
  DEBT_BUYER: "Debt Buyer",
  OTHER: "Other",
};

const TYPE_BADGE: Record<CreditorType, string> = {
  ORIGINAL_CREDITOR: "bg-blue-100 text-blue-700",
  COLLECTION_AGENCY: "bg-orange-100 text-orange-700",
  LAW_FIRM: "bg-purple-100 text-purple-700",
  DEBT_BUYER: "bg-yellow-100 text-yellow-700",
  OTHER: "bg-gray-100 text-gray-500",
};

const CHANNEL_LABEL: Record<ContactChannel, string> = {
  PHONE: "Phone",
  EMAIL: "Email",
  FAX: "Fax",
  MAIL: "Mail",
  PORTAL: "Portal",
  OTHER: "Other",
};

export default async function CreditorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; active?: string; page?: string }>;
}) {
  await requireAuth();

  const { q = "", type, active, page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.CreditorWhereInput = {};

  if (q.trim()) {
    where.OR = [
      { name: { contains: q.trim() } },
      { phone: { contains: q.trim() } },
      { email: { contains: q.trim() } },
    ];
  }

  const isValidType = (s: string): s is CreditorType =>
    Object.keys(TYPE_LABEL).includes(s);
  if (type && isValidType(type)) {
    where.type = type;
  }

  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;

  const [creditors, total] = await Promise.all([
    prisma.creditor.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        phone: true,
        email: true,
        preferredChannel: true,
        isActive: true,
        _count: { select: { debtAccounts: true } },
      },
    }),
    prisma.creditor.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (type) sp.set("type", type);
    if (active) sp.set("active", active);
    sp.set("page", String(p));
    return `/creditors?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Creditors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} creditor{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/creditors/new" className={buttonVariants()}>
          New Creditor
        </Link>
      </div>

      {/* Filters */}
      <form method="get" action="/creditors" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search name, phone, email…"
          className="h-8 w-64 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="active"
          defaultValue={active ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Active &amp; Inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
        {(q || type || active) && (
          <Link
            href="/creditors"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
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
              <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Contact</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Pref. Channel</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Accounts</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {creditors.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No creditors found.
                </td>
              </tr>
            ) : (
              creditors.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/creditors/${c.id}`}
                      className="font-medium hover:underline underline-offset-2"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {c.type ? (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${TYPE_BADGE[c.type]}`}
                      >
                        {TYPE_LABEL[c.type]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{c.phone ?? "—"}</div>
                    {c.email && (
                      <div className="text-xs mt-0.5">{c.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.preferredChannel ? CHANNEL_LABEL[c.preferredChannel] : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {c._count.debtAccounts}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        c.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
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
