import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import type { CreditorType, ContactChannel, DebtAccountStatus } from "@prisma/client";

// ─── Label / badge maps ────────────────────────────────────────────────────

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
  PORTAL: "Online Portal",
  OTHER: "Other",
};

const DEBT_STATUS_LABEL: Record<DebtAccountStatus, string> = {
  ACTIVE: "Active",
  IN_NEGOTIATION: "In Negotiation",
  SETTLED: "Settled",
  CHARGED_OFF: "Charged Off",
  DISPUTED: "Disputed",
  WITHDRAWN: "Withdrawn",
};

const DEBT_STATUS_BADGE: Record<DebtAccountStatus, string> = {
  ACTIVE: "bg-blue-100 text-blue-700",
  IN_NEGOTIATION: "bg-yellow-100 text-yellow-700",
  SETTLED: "bg-green-100 text-green-700",
  CHARGED_OFF: "bg-gray-100 text-gray-500",
  DISPUTED: "bg-orange-100 text-orange-700",
  WITHDRAWN: "bg-red-100 text-red-600",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(n: { toString(): string }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(n.toString()));
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function CreditorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const creditor = await prisma.creditor.findUnique({
    where: { id },
    include: {
      debtAccounts: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!creditor) notFound();

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: "Creditor", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <nav className="text-xs text-muted-foreground mb-1">
            <Link href="/creditors" className="hover:underline">
              Creditors
            </Link>{" "}
            /
          </nav>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">{creditor.name}</h1>
            {creditor.type && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${TYPE_BADGE[creditor.type]}`}
              >
                {TYPE_LABEL[creditor.type]}
              </span>
            )}
            {!creditor.isActive && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                Inactive
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/creditors/${id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          Edit
        </Link>
      </div>

      {/* Contact info + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Contact Information</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Phone
              </dt>
              <dd className="mt-1">{creditor.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Email
              </dt>
              <dd className="mt-1">{creditor.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Website
              </dt>
              <dd className="mt-1">
                {creditor.website ? (
                  <span className="text-muted-foreground">{creditor.website}</span>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Preferred Channel
              </dt>
              <dd className="mt-1">
                {creditor.preferredChannel
                  ? CHANNEL_LABEL[creditor.preferredChannel]
                  : "—"}
              </dd>
            </div>
            {creditor.address && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                  Mailing Address
                </dt>
                <dd className="mt-1 whitespace-pre-line">{creditor.address}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Internal Notes</h2>
          {creditor.notes ? (
            <p className="text-sm whitespace-pre-line leading-relaxed">
              {creditor.notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes recorded.</p>
          )}
        </div>
      </div>

      {/* Linked debt accounts */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">
            Linked Debt Accounts ({creditor.debtAccounts.length})
          </h2>
        </div>
        {creditor.debtAccounts.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No debt accounts linked to this creditor.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Acct #
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                    Original
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                    Current
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Follow-Up
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {creditor.debtAccounts.map((acct) => (
                  <tr key={acct.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/clients/${acct.client.id}`}
                        className="hover:underline"
                      >
                        {acct.client.firstName} {acct.client.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      <Link href={`/accounts/${acct.id}`} className="hover:underline">
                        {acct.accountNumber ?? "View"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right">
                      {formatCurrency(acct.originalBalance)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right">
                      {formatCurrency(acct.currentBalance)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${DEBT_STATUS_BADGE[acct.status]}`}
                      >
                        {DEBT_STATUS_LABEL[acct.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {acct.nextFollowUpDate ? formatDate(acct.nextFollowUpDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit timeline */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">Change History</h2>
        </div>
        {auditLogs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No history recorded.
          </p>
        ) : (
          <ul className="divide-y">
            {auditLogs.map((log) => (
              <li key={log.id} className="px-5 py-3 flex items-start gap-3">
                <span
                  className={`shrink-0 text-xs rounded px-2 py-0.5 font-medium mt-0.5 ${
                    log.action === "CREATE"
                      ? "bg-green-100 text-green-700"
                      : log.action === "DELETE"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{log.user?.name ?? "System"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
