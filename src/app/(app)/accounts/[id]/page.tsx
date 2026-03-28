import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { formatDate, formatCurrency } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { ActivityForm } from "@/components/debt-accounts/ActivityForm";
import {
  OfferForm,
  AcceptOfferButton,
} from "@/components/debt-accounts/OfferForm";
import { InlineTaskForm } from "@/components/tasks/InlineTaskForm";
import { CompleteTaskButton } from "@/components/tasks/CompleteTaskButton";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import type {
  DebtAccountStatus,
  DelinquencyStage,
  ActivityType,
  OfferStatus,
  PaymentType,
  TaskPriority,
} from "@prisma/client";

// ─── Label / badge maps ────────────────────────────────────────────────────

const DEBT_STATUS_LABEL: Record<DebtAccountStatus, string> = {
  ACTIVE: "Active",
  IN_NEGOTIATION: "In Negotiation",
  SETTLED: "Settled",
  CHARGED_OFF: "Charged Off",
  DISPUTED: "Disputed",
  WITHDRAWN: "Withdrawn",
};

const DEBT_STATUS_BADGE: Record<DebtAccountStatus, string> = {
  ACTIVE: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  IN_NEGOTIATION: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  SETTLED: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  CHARGED_OFF: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  DISPUTED: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  WITHDRAWN: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

const DELINQUENCY_LABEL: Record<DelinquencyStage, string> = {
  CURRENT: "Current",
  LATE_30: "30 Days Late",
  LATE_60: "60 Days Late",
  LATE_90: "90 Days Late",
  LATE_120: "120 Days Late",
  LATE_180_PLUS: "180+ Days Late",
  CHARGED_OFF: "Charged Off",
};

const DELINQUENCY_BADGE: Record<DelinquencyStage, string> = {
  CURRENT: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  LATE_30: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  LATE_60: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  LATE_90: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  LATE_120: "bg-red-100 text-red-700 ring-1 ring-inset ring-red-700/25",
  LATE_180_PLUS: "bg-red-200 text-red-800 ring-1 ring-inset ring-red-700/30",
  CHARGED_OFF: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
};

const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COUNTERED: "Countered",
  EXPIRED: "Expired",
};

const OFFER_STATUS_BADGE: Record<OfferStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  COUNTERED: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  EXPIRED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
};

const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  LUMP_SUM: "Lump Sum",
  INSTALLMENT: "Installment",
};

const TASK_PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  MEDIUM: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  HIGH: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  URGENT: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  CALL: "Phone Call",
  VOICEMAIL: "Voicemail",
  EMAIL: "Email",
  LETTER: "Mailed Letter",
  INTERNAL_NOTE: "Internal Note",
  CLIENT_UPDATE: "Client Update",
  SETTLEMENT_DISCUSSION: "Settlement Discussion",
  STATUS_CHANGE: "Status Change",
  OFFER_SENT: "Offer Sent",
  OFFER_RECEIVED: "Offer Received",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function isOverdue(date: Date | null | undefined) {
  if (!date) return false;
  return new Date(date) < new Date();
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function DebtAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const [account, users] = await Promise.all([
    prisma.debtAccount.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        creditor: { select: { id: true, name: true } },
        activities: {
          orderBy: { occurredAt: "desc" },
          take: 25,
          include: { author: { select: { name: true } } },
        },
        offers: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        tasks: {
          orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
          include: { assignedTo: { select: { name: true } } },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!account) notFound();

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: "DebtAccount", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { user: { select: { name: true } } },
  });

  const creditorName =
    account.creditor?.name ?? account.originalCreditorName ?? "Unknown";

  const followUpOverdue = isOverdue(account.nextFollowUpDate);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <nav className="text-xs text-muted-foreground mb-1">
            <Link href="/clients" className="hover:underline">
              Clients
            </Link>{" "}
            /{" "}
            <Link
              href={`/clients/${account.client.id}`}
              className="hover:underline"
            >
              {account.client.firstName} {account.client.lastName}
            </Link>{" "}
            /
          </nav>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">{creditorName}</h1>
            {account.accountNumber && (
              <span className="font-mono text-sm text-muted-foreground">
                {account.accountNumber}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DEBT_STATUS_BADGE[account.status]}`}
            >
              {DEBT_STATUS_LABEL[account.status]}
            </span>
            {account.delinquencyStage && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DELINQUENCY_BADGE[account.delinquencyStage]}`}
              >
                {DELINQUENCY_LABEL[account.delinquencyStage]}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Client:{" "}
            <Link
              href={`/clients/${account.client.id}`}
              className="hover:underline"
            >
              {account.client.firstName} {account.client.lastName}
            </Link>
          </p>
        </div>
        <Link
          href={`/accounts/${id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          Edit
        </Link>
      </div>

      {/* Key metrics + dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balances */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Balances</h2>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Original
              </dt>
              <dd className="mt-1 font-medium tabular-nums">
                {formatCurrency(account.originalBalance)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Current
              </dt>
              <dd className="mt-1 font-medium tabular-nums">
                {formatCurrency(account.currentBalance)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Settled
              </dt>
              <dd className="mt-1 font-medium tabular-nums text-muted-foreground">
                {formatCurrency(account.settledAmount)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Dates */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Key Dates</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Account Opened
              </dt>
              <dd className="mt-1">{formatDate(account.openedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Charged Off
              </dt>
              <dd className="mt-1">{formatDate(account.chargedOffAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Last Contact
              </dt>
              <dd className="mt-1">{formatDate(account.lastContactDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Next Follow-Up
              </dt>
              <dd
                className={`mt-1 ${followUpOverdue ? "text-destructive font-medium" : ""}`}
              >
                {formatDate(account.nextFollowUpDate)}
                {followUpOverdue && (
                  <span className="ml-1 text-xs">(overdue)</span>
                )}
              </dd>
            </div>
            {account.settledAt && (
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                  Settled
                </dt>
                <dd className="mt-1">{formatDate(account.settledAt)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Offers */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Offers
            {account.offers.length > 0 && (
              <span className="ml-1.5 text-muted-foreground font-normal">
                ({account.offers.length})
              </span>
            )}
          </h2>
        </div>

        <OfferForm debtAccountId={id} />

        {account.offers.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No offers recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Direction</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">% of Bal.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expires</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {account.offers.map((offer) => (
                  <tr
                    key={offer.id}
                    className={`hover:bg-muted/20 ${offer.status === "ACCEPTED" ? "bg-green-50/60" : ""}`}
                  >
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {offer.direction === "OUTGOING" ? "We sent" : "Received"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right font-medium whitespace-nowrap">
                      {formatCurrency(offer.amount)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right text-xs text-muted-foreground whitespace-nowrap">
                      {offer.percentOfBalance != null
                        ? `${Number(offer.percentOfBalance.toString()).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {PAYMENT_TYPE_LABEL[offer.paymentType]}
                      {offer.paymentType === "INSTALLMENT" &&
                        offer.installmentCount != null && (
                          <span className="text-muted-foreground ml-1">
                            ×{offer.installmentCount}
                            {offer.installmentFreq
                              ? ` ${offer.installmentFreq}`
                              : ""}
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">
                      {offer.source ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${OFFER_STATUS_BADGE[offer.status]}`}
                      >
                        {OFFER_STATUS_LABEL[offer.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(offer.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(offer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {offer.status === "PENDING" && (
                        <AcceptOfferButton
                          offerId={offer.id}
                          debtAccountId={id}
                          currentStatus={offer.status}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Tasks
            {account.tasks.length > 0 && (
              <span className="ml-1.5 text-muted-foreground font-normal">
                ({account.tasks.length})
              </span>
            )}
          </h2>
        </div>

        <InlineTaskForm
          debtAccountId={id}
          clientId={account.client.id}
          users={users}
        />

        {account.tasks.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No tasks yet.
          </p>
        ) : (
          <ul className="divide-y">
            {account.tasks.map((task) => {
              const isDone = task.status === "DONE" || task.status === "CANCELLED";
              return (
                <li
                  key={task.id}
                  className={`px-5 py-3 flex items-center gap-3 ${isDone ? "opacity-50" : ""}`}
                >
                  {!isDone ? (
                    <CompleteTaskButton taskId={task.id} />
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full bg-muted" />
                  )}
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TASK_PRIORITY_BADGE[task.priority]}`}
                  >
                    {task.priority.charAt(0) +
                      task.priority.slice(1).toLowerCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/tasks/${task.id}/edit`}
                      className="text-sm font-medium hover:underline underline-offset-2 truncate block"
                    >
                      {task.title}
                    </Link>
                    {task.assignedTo && (
                      <p className="text-xs text-muted-foreground">
                        {task.assignedTo.name}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {task.dueDate ? formatDate(task.dueDate) : "—"}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Activity log */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">
            Activity ({account.activities.length})
          </h2>
        </div>

        <ActivityForm
          debtAccountId={id}
          clientId={account.client.id}
        />

        {account.activities.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        ) : (
          <ul className="divide-y">
            {account.activities.map((act) => (
              <li key={act.id} className="px-5 py-3 flex items-start gap-3">
                <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium mt-0.5">
                  {ACTIVITY_LABEL[act.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {act.notes}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {act.author.name} · {formatDate(act.occurredAt)}
                    {act.nextActionDate && (
                      <span className="ml-2 text-yellow-600 font-medium">
                        · Next action: {formatDate(act.nextActionDate)}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Documents */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">
            Documents
            {account.documents.length > 0 && (
              <span className="ml-1.5 text-muted-foreground font-normal">
                ({account.documents.length})
              </span>
            )}
          </h2>
        </div>
        <DocumentUploadForm
          clientId={account.client.id}
          debtAccountId={id}
          documents={account.documents}
        />
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
                  className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-0.5 ${
                    log.action === "CREATE"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                      : log.action === "DELETE"
                        ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                        : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
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
