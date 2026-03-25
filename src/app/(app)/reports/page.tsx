import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Reports — DZC DMS" };

const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  IN_NEGOTIATION: "In Negotiation",
  SETTLED: "Settled",
  CHARGED_OFF: "Charged Off",
  DISPUTED: "Disputed",
  WITHDRAWN: "Withdrawn",
};

const ACCOUNT_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700",
  IN_NEGOTIATION: "bg-yellow-100 text-yellow-700",
  SETTLED: "bg-green-100 text-green-700",
  CHARGED_OFF: "bg-gray-100 text-gray-600",
  DISPUTED: "bg-orange-100 text-orange-700",
  WITHDRAWN: "bg-red-100 text-red-700",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { days } = await searchParams;
  const noActivityDays = Math.max(1, parseInt(String(days ?? "30"), 10) || 30);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - noActivityDays);

  const [
    activeClientsCount,
    activeAccountsCount,
    accountsByStatus,
    followUpsTodayCount,
    overdueTasksCount,
    settlementAgg,
    noActivityCount,
  ] = await Promise.all([
    // 1. Active clients (ACTIVE + ONBOARDING)
    prisma.client.count({
      where: { status: { in: ["ACTIVE", "ONBOARDING"] } },
    }),

    // 2. Active debt accounts (ACTIVE + IN_NEGOTIATION)
    prisma.debtAccount.count({
      where: { status: { in: ["ACTIVE", "IN_NEGOTIATION"] } },
    }),

    // 3. All accounts grouped by status
    prisma.debtAccount.groupBy({
      by: ["status"],
      _count: { status: true },
      _sum: { originalBalance: true, currentBalance: true, settledAmount: true },
    }),

    // 4. Follow-ups due today (open tasks with dueDate today)
    prisma.task.count({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { gte: today, lt: tomorrow },
      },
    }),

    // 5. Overdue tasks (open tasks with dueDate before today)
    prisma.task.count({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { lt: today },
      },
    }),

    // 6 & 7. Settlement totals and average percentage for SETTLED accounts
    prisma.debtAccount.aggregate({
      where: { status: "SETTLED" },
      _sum: { settledAmount: true, originalBalance: true },
      _count: { id: true },
      _avg: { settledAmount: true },
    }),

    // 8. Active/in-negotiation accounts with no activity in last X days
    prisma.debtAccount.count({
      where: {
        status: { in: ["ACTIVE", "IN_NEGOTIATION"] },
        activities: {
          none: {
            occurredAt: { gte: cutoffDate },
          },
        },
      },
    }),
  ]);

  // Compute settlement figures
  const totalSettled = Number(settlementAgg._sum.settledAmount ?? 0);
  const totalOriginalOfSettled = Number(settlementAgg._sum.originalBalance ?? 0);
  const settledCount = settlementAgg._count.id;
  const avgSettlementPct =
    totalOriginalOfSettled > 0
      ? (totalSettled / totalOriginalOfSettled) * 100
      : 0;

  // Build status map for rendering
  const statusMap = Object.fromEntries(
    accountsByStatus.map((g) => [
      g.status,
      {
        count: g._count.status,
        originalBalance: Number(g._sum.originalBalance ?? 0),
        currentBalance: Number(g._sum.currentBalance ?? 0),
        settledAmount: Number(g._sum.settledAmount ?? 0),
      },
    ])
  );

  const totalAccounts = accountsByStatus.reduce(
    (acc, g) => acc + g._count.status,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Program-wide metrics and portfolio overview
        </p>
      </div>

      {/* Key stats */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Program Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Clients" value={activeClientsCount} />
          <StatCard label="Active Accounts" value={activeAccountsCount} />
          <StatCard label="Follow-ups Today" value={followUpsTodayCount} />
          <StatCard
            label="Overdue Tasks"
            value={overdueTasksCount}
            highlight={overdueTasksCount > 0}
          />
        </div>
      </section>

      {/* Settlement metrics */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Settlement Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Accounts Settled</p>
            <p className="text-3xl font-semibold mt-1 tabular-nums">
              {settledCount}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Settled Amount</p>
            <p className="text-3xl font-semibold mt-1 tabular-nums">
              {formatCurrency(totalSettled)}
            </p>
            {totalOriginalOfSettled > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                of {formatCurrency(totalOriginalOfSettled)} original balance
              </p>
            )}
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Avg Settlement Rate
            </p>
            <p className="text-3xl font-semibold mt-1 tabular-nums">
              {avgSettlementPct > 0 ? `${avgSettlementPct.toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              settled / original balance
            </p>
          </div>
        </div>
      </section>

      {/* Accounts by status */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Accounts by Status
        </h2>
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                  Accounts
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  % of Total
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Original Balance
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Current Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(ACCOUNT_STATUS_LABEL).map(([status, label]) => {
                const data = statusMap[status];
                if (!data) return null;
                const pct =
                  totalAccounts > 0
                    ? ((data.count / totalAccounts) * 100).toFixed(1)
                    : "0.0";
                return (
                  <tr key={status} className="hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs rounded px-2 py-0.5 font-medium ${ACCOUNT_STATUS_COLOR[status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">
                      {data.count}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                      {pct}%
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                      {formatCurrency(data.originalBalance)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                      {formatCurrency(data.currentBalance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t bg-muted/20">
              <tr>
                <td className="px-5 py-3 font-medium">Total</td>
                <td className="px-5 py-3 text-right tabular-nums font-semibold">
                  {totalAccounts}
                </td>
                <td className="px-5 py-3 hidden sm:table-cell" />
                <td className="px-5 py-3 text-right tabular-nums font-medium hidden md:table-cell">
                  {formatCurrency(
                    accountsByStatus.reduce(
                      (sum, g) => sum + Number(g._sum.originalBalance ?? 0),
                      0
                    )
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium hidden md:table-cell">
                  {formatCurrency(
                    accountsByStatus.reduce(
                      (sum, g) => sum + Number(g._sum.currentBalance ?? 0),
                      0
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Accounts with no activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Stale Accounts
          </h2>
          <NoActivityForm days={noActivityDays} />
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-baseline gap-3">
          <span className="text-3xl font-semibold tabular-nums">
            {noActivityCount}
          </span>
          <span className="text-sm text-muted-foreground">
            active / in-negotiation accounts with no activity in the last{" "}
            <strong>{noActivityDays}</strong> days
          </span>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${highlight ? "border-red-200 bg-red-50" : "bg-card"}`}
    >
      <p className={`text-sm ${highlight ? "text-red-600" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p
        className={`text-3xl font-semibold mt-1 tabular-nums ${highlight ? "text-red-700" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function NoActivityForm({ days }: { days: number }) {
  return (
    <form method="GET" className="flex items-center gap-2">
      <label className="text-xs text-muted-foreground">Last</label>
      <input
        type="number"
        name="days"
        defaultValue={days}
        min={1}
        max={365}
        className="w-16 rounded-md border bg-background px-2 py-1 text-xs tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <label className="text-xs text-muted-foreground">days</label>
      <button
        type="submit"
        className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground font-medium"
      >
        Apply
      </button>
    </form>
  );
}
