import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";

export const metadata = { title: "Dashboard — DZC DMS" };

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-gray-100 text-gray-500",
};

const ACTIVITY_LABEL: Record<string, string> = {
  CALL: "Call",
  EMAIL: "Email",
  LETTER: "Letter",
  INTERNAL_NOTE: "Note",
  STATUS_CHANGE: "Status Change",
  OFFER_SENT: "Offer Sent",
  OFFER_RECEIVED: "Offer Received",
};

const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  IN_NEGOTIATION: "In Negotiation",
  SETTLED: "Settled",
  CHARGED_OFF: "Charged Off",
  DISPUTED: "Disputed",
  WITHDRAWN: "Withdrawn",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const session = await auth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    activeClientsCount,
    openAccountsCount,
    followUpsTodayCount,
    overdueTasksCount,
    followUpsToday,
    overdueTasksList,
    accountsByStatus,
    recentActivity,
  ] = await Promise.all([
    prisma.client.count({
      where: { status: { in: ["ACTIVE", "ONBOARDING"] } },
    }),
    prisma.debtAccount.count({
      where: { status: { in: ["ACTIVE", "IN_NEGOTIATION"] } },
    }),
    prisma.task.count({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { gte: today, lt: tomorrow },
      },
    }),
    prisma.task.count({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { lt: today },
      },
    }),
    prisma.task.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { gte: today, lt: tomorrow },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      select: {
        id: true,
        title: true,
        priority: true,
        client: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { lt: today },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        client: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.debtAccount.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.negotiationActivity.findMany({
      take: 8,
      orderBy: { occurredAt: "desc" },
      select: {
        id: true,
        type: true,
        notes: true,
        occurredAt: true,
        author: { select: { name: true } },
        debtAccount: {
          select: {
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  const statusCountMap = Object.fromEntries(
    accountsByStatus.map((g) => [g.status, g._count.status])
  );

  const stats = [
    { label: "Active Clients", value: activeClientsCount },
    { label: "Open Accounts", value: openAccountsCount },
    { label: "Follow-ups Today", value: followUpsTodayCount },
    { label: "Overdue Tasks", value: overdueTasksCount },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {session?.user?.name ?? "—"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold mt-1 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Follow-ups today & Overdue tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follow-ups due today */}
        <div className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Follow-ups Due Today</h2>
          </div>
          {followUpsToday.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No follow-ups due today.
            </p>
          ) : (
            <ul className="divide-y">
              {followUpsToday.map((task) => (
                <li key={task.id} className="px-5 py-3 flex items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 text-xs rounded px-1.5 py-0.5 font-medium ${PRIORITY_BADGE[task.priority] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {task.priority.charAt(0) +
                      task.priority.slice(1).toLowerCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.client
                        ? `${task.client.firstName} ${task.client.lastName}`
                        : "No client"}
                      {task.assignedTo ? ` · ${task.assignedTo.name}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Overdue tasks */}
        <div className="rounded-xl border bg-card">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Overdue Tasks</h2>
          </div>
          {overdueTasksList.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No overdue tasks.
            </p>
          ) : (
            <ul className="divide-y">
              {overdueTasksList.map((task) => (
                <li key={task.id} className="px-5 py-3 flex items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 text-xs rounded px-1.5 py-0.5 font-medium ${PRIORITY_BADGE[task.priority] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {task.priority.charAt(0) +
                      task.priority.slice(1).toLowerCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(task.dueDate ?? null)}
                      {task.client
                        ? ` · ${task.client.firstName} ${task.client.lastName}`
                        : ""}
                      {task.assignedTo ? ` · ${task.assignedTo.name}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Active accounts by status */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">Accounts by Status</h2>
        </div>
        <div className="px-5 py-4 flex flex-wrap gap-3">
          {Object.entries(ACCOUNT_STATUS_LABEL).map(([status, label]) => (
            <div
              key={status}
              className="flex items-baseline gap-2 bg-muted rounded-lg px-4 py-3"
            >
              <span className="text-xl font-semibold tabular-nums">
                {statusCountMap[status] ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No recent activity.
          </p>
        ) : (
          <ul className="divide-y">
            {recentActivity.map((activity) => (
              <li
                key={activity.id}
                className="px-5 py-3 flex items-start gap-4"
              >
                <span className="shrink-0 text-xs bg-muted text-muted-foreground rounded px-2 py-1 mt-0.5">
                  {ACTIVITY_LABEL[activity.type] ?? activity.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{activity.notes}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.debtAccount.client
                      ? `${activity.debtAccount.client.firstName} ${activity.debtAccount.client.lastName}`
                      : "Unknown client"}{" "}
                    · {activity.author.name} ·{" "}
                    {formatDate(activity.occurredAt)}
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
