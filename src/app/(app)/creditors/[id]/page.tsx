import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import type { CreditorType, ContactChannel, DebtAccountStatus } from "@prisma/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  CARD, CARD_HEADER, CARD_TITLE,
  TABLE_TH, TABLE_TR, TABLE_TD,
  PILL, ACCOUNT_STATUS_BADGE, CREDITOR_TYPE_BADGE,
  PILL_GREEN, PILL_BLUE, PILL_RED, PILL_GRAY,
  LINK_SUBTLE,
} from "@/lib/ui-classes";

// ─── Label maps ────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<CreditorType, string> = {
  ORIGINAL_CREDITOR: "Original Creditor",
  COLLECTION_AGENCY: "Collection Agency",
  LAW_FIRM: "Law Firm",
  DEBT_BUYER: "Debt Buyer",
  OTHER: "Other",
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
              <span className={`${PILL} ${CREDITOR_TYPE_BADGE[creditor.type]}`}>
                {TYPE_LABEL[creditor.type]}
              </span>
            )}
            {!creditor.isActive && (
              <span className={`${PILL} ${PILL_GRAY}`}>Inactive</span>
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
        <div className={`lg:col-span-2 ${CARD} p-5 space-y-4`}>
          <h2 className={CARD_TITLE}>Contact Information</h2>
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

        <div className={`${CARD} p-5`}>
          <h2 className={`${CARD_TITLE} mb-3`}>Internal Notes</h2>
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
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <h2 className={CARD_TITLE}>
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
              <thead className="bg-muted/50 border-b">
                <tr className="text-left">
                  <th className={TABLE_TH}>Client</th>
                  <th className={TABLE_TH}>Acct #</th>
                  <th className={`${TABLE_TH} text-right`}>Original</th>
                  <th className={`${TABLE_TH} text-right`}>Current</th>
                  <th className={TABLE_TH}>Status</th>
                  <th className={TABLE_TH}>Follow-Up</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {creditor.debtAccounts.map((acct) => (
                  <tr key={acct.id} className={TABLE_TR}>
                    <td className={TABLE_TD}>
                      <Link href={`/clients/${acct.client.id}`} className={LINK_SUBTLE}>
                        {acct.client.firstName} {acct.client.lastName}
                      </Link>
                    </td>
                    <td className={`${TABLE_TD} font-mono text-xs text-muted-foreground`}>
                      <Link href={`/accounts/${acct.id}`} className="hover:underline">
                        {acct.accountNumber ?? "View"}
                      </Link>
                    </td>
                    <td className={`${TABLE_TD} tabular-nums text-right`}>
                      {formatCurrency(acct.originalBalance)}
                    </td>
                    <td className={`${TABLE_TD} tabular-nums text-right`}>
                      {formatCurrency(acct.currentBalance)}
                    </td>
                    <td className={TABLE_TD}>
                      <span className={`${PILL} ${ACCOUNT_STATUS_BADGE[acct.status]}`}>
                        {DEBT_STATUS_LABEL[acct.status]}
                      </span>
                    </td>
                    <td className={`${TABLE_TD} text-xs text-muted-foreground`}>
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
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <h2 className={CARD_TITLE}>Change History</h2>
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
                  className={`shrink-0 mt-0.5 ${PILL} ${
                    log.action === "CREATE"
                      ? PILL_GREEN
                      : log.action === "DELETE"
                        ? PILL_RED
                        : PILL_BLUE
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
