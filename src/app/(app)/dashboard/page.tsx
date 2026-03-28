import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { formatDate } from "@/lib/utils";
import {
  CARD, CARD_HEADER, CARD_TITLE,
  PILL, TASK_PRIORITY_BADGE,
  PAGE_TITLE, PAGE_SUBTITLE,
} from "@/lib/ui-classes";

export const metadata = { title: "Dashboard — DZC DMS" };

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

  const statAccents = [
    "border-l-4 border-l-blue-500",
    "border-l-4 border-l-violet-500",
    "border-l-4 border-l-amber-500",
    "border-l-4 border-l-red-500",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className={PAGE_TITLE}>Dashboard</h1>
        <p className={PAGE_SUBTITLE}>Welcome back, {session?.user?.name ?? "—"}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value }, i) => (
          <div key={label} className={`${CARD} p-5 ${statAccents[i]}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-semibold mt-2 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Follow-ups today & Overdue tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follow-ups due today */}
        <div className={CARD}>
          <div className={CARD_HEADER}>
            <h2 className={CARD_TITLE}>Follow-ups Due Today</h2>
          </div>
          {followUpsToday.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">
              All clear — no follow-ups due today.
            </p>
          ) : (
            <ul className="divide-y">
              {followUpsToday.map((task) => (
                <li key={task.id} className="px-5 py-3 flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 ${PILL} ${TASK_PRIORITY_BADGE[task.priority] ?? ""}`}>
                    {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
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
        <div className={CARD}>
          <div className={CARD_HEADER}>
            <h2 className={CARD_TITLE}>Overdue Tasks</h2>
          </div>
          {overdueTasksList.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">
              No overdue tasks. Great work!
            </p>
          ) : (
            <ul className="divide-y">
              {overdueTasksList.map((task) => (
                <li key={task.id} className="px-5 py-3 flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 ${PILL} ${TASK_PRIORITY_BADGE[task.priority] ?? ""}`}>
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
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <h2 className={CARD_TITLE}>Accounts by Status</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(ACCOUNT_STATUS_LABEL).map(([status, label]) => (
            <div
              key={status}
              className="flex flex-col gap-1 bg-muted/60 rounded-xl px-4 py-3 border border-border/60"
            >
              <span className="text-2xl font-semibold tabular-nums">
                {statusCountMap[status] ?? 0}
              </span>
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <h2 className={CARD_TITLE}>Recent Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No recent activity logged yet.
          </p>
        ) : (
          <ul className="divide-y">
            {recentActivity.map((activity) => (
              <li
                key={activity.id}
                className="px-5 py-3 flex items-start gap-4"
              >
                <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium mt-0.5">
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
