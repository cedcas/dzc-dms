import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import type { ClientStatus, DebtAccountStatus } from "@prisma/client";
import { formatDate, formatCurrency } from "@/lib/utils";

const STATUS_LABEL: Record<ClientStatus, string> = {
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  GRADUATED: "Graduated",
  WITHDRAWN: "Withdrawn",
  DEFAULTED: "Defaulted",
};

const STATUS_BADGE: Record<ClientStatus, string> = {
  ONBOARDING: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  GRADUATED: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20",
  WITHDRAWN: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  DEFAULTED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
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
  ACTIVE: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  IN_NEGOTIATION: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  SETTLED: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  CHARGED_OFF: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  DISPUTED: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  WITHDRAWN: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  HIGH: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  MEDIUM: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  LOW: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      handler: { select: { id: true, name: true } },
      debtAccounts: {
        orderBy: { createdAt: "desc" },
        include: { creditor: { select: { name: true } } },
      },
      tasks: {
        where: { status: { notIn: ["DONE", "CANCELLED"] } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 15,
        include: { assignedTo: { select: { name: true } } },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!client) notFound();

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: "Client", entityId: id },
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
            <Link href="/clients" className="hover:underline">
              Clients
            </Link>{" "}
            /
          </nav>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">
              {client.firstName} {client.lastName}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[client.status]}`}
            >
              {STATUS_LABEL[client.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enrolled {formatDate(client.enrolledAt)}
          </p>
        </div>
        <Link
          href={`/clients/${id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          Edit
        </Link>
      </div>

      {/* Summary + Hardship notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Summary</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Email
              </dt>
              <dd className="mt-1">{client.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Phone
              </dt>
              <dd className="mt-1">{client.phone ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Address
              </dt>
              <dd className="mt-1 whitespace-pre-line">
                {client.address ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Program Start
              </dt>
              <dd className="mt-1">{formatDate(client.programStartDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                Assigned Owner
              </dt>
              <dd className="mt-1">{client.handler?.name ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Hardship Notes</h2>
          {client.notes ? (
            <p className="text-sm whitespace-pre-line leading-relaxed">
              {client.notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes recorded.</p>
          )}
        </div>
      </div>

      {/* Debt accounts */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">
            Debt Accounts ({client.debtAccounts.length})
          </h2>
          <Link
            href={`/clients/${id}/accounts/new`}
            className={buttonVariants({ variant: "outline" }) + " text-xs h-7 px-3"}
          >
            + Add Account
          </Link>
        </div>
        {client.debtAccounts.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No debt accounts linked.
            </p>
            <Link
              href={`/clients/${id}/accounts/new`}
              className={buttonVariants({ variant: "outline" })}
            >
              Add First Account
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Creditor</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acct #</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Original</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Current</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Settled</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Follow-Up</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {client.debtAccounts.map((acct) => (
                  <tr
                    key={acct.id}
                    className="hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/accounts/${acct.id}`}
                        className="hover:underline"
                      >
                        {acct.creditor?.name ?? acct.originalCreditorName ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {acct.accountNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right">
                      {formatCurrency(acct.originalBalance)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right">
                      {formatCurrency(acct.currentBalance)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right text-muted-foreground">
                      {acct.settledAmount
                        ? formatCurrency(acct.settledAmount)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DEBT_STATUS_BADGE[acct.status]}`}
                      >
                        {DEBT_STATUS_LABEL[acct.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {acct.nextFollowUpDate
                        ? formatDate(acct.nextFollowUpDate)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open tasks */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">Open Tasks</h2>
        </div>
        {client.tasks.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No open tasks.
          </p>
        ) : (
          <ul className="divide-y">
            {client.tasks.map((task) => (
              <li key={task.id} className="px-5 py-3 flex items-center gap-3">
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20"}`}
                >
                  {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <div>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</div>
                  {task.assignedTo && <div>{task.assignedTo.name}</div>}
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
            Documents ({client.documents.length})
          </h2>
        </div>
        <DocumentUploadForm
          clientId={id}
          documents={client.documents}
        />
      </div>

      {/* Audit timeline */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">Timeline</h2>
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
