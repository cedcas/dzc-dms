import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { CompleteTaskButton } from "@/components/tasks/CompleteTaskButton";
import type { TaskStatus, TaskPriority, Prisma } from "@prisma/client";

export const metadata = { title: "Tasks — DZC DMS" };

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-500",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const DUE_FILTER_LABEL: Record<string, string> = {
  all: "All Dates",
  today: "Due Today",
  overdue: "Overdue",
  week: "Next 7 Days",
};

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(d: Date | null | undefined): boolean {
  if (!d) return false;
  return new Date(d) < new Date(new Date().setHours(0, 0, 0, 0));
}

const isValidStatus = (s: string): s is TaskStatus =>
  Object.keys(STATUS_LABEL).includes(s);

const isValidPriority = (p: string): p is TaskPriority =>
  Object.keys(PRIORITY_LABEL).includes(p);

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    assignee?: string;
    due?: string;
    page?: string;
  }>;
}) {
  await requireAuth();

  const {
    status,
    priority,
    assignee,
    due = "all",
    page: pageStr = "1",
  } = await searchParams;

  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const where: Prisma.TaskWhereInput = {};

  if (status && isValidStatus(status)) {
    where.status = status;
  }
  if (priority && isValidPriority(priority)) {
    where.priority = priority;
  }
  if (assignee) {
    where.assignedToId = assignee;
  }
  if (due === "today") {
    where.dueDate = { gte: today, lt: tomorrow };
  } else if (due === "overdue") {
    where.dueDate = { lt: today };
    if (!where.status) where.status = { notIn: ["DONE", "CANCELLED"] };
  } else if (due === "week") {
    where.dueDate = { gte: today, lt: nextWeek };
  }

  const [tasks, total, users] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        client: { select: { id: true, firstName: true, lastName: true } },
        debtAccount: {
          select: {
            id: true,
            creditor: { select: { name: true } },
            originalCreditorName: true,
          },
        },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.task.count({ where }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (priority) sp.set("priority", priority);
    if (assignee) sp.set("assignee", assignee);
    if (due !== "all") sp.set("due", due);
    sp.set("page", String(p));
    return `/tasks?${sp.toString()}`;
  }

  function filterUrl(overrides: Record<string, string>) {
    const sp = new URLSearchParams();
    const merged = { status, priority, assignee, due, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all" && v !== "") sp.set(k, v);
    }
    return `/tasks?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} task{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/tasks/new" className={buttonVariants()}>
          New Task
        </Link>
      </div>

      {/* Filters */}
      <form method="get" action="/tasks" className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          name="priority"
          defaultValue={priority ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          name="assignee"
          defaultValue={assignee ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select
          name="due"
          defaultValue={due}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {Object.entries(DUE_FILTER_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <button
          type="submit"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Filter
        </button>

        {(status || priority || assignee || due !== "all") && (
          <Link
            href="/tasks"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Clear
          </Link>
        )}
      </form>

      {/* Quick-filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "today", "overdue", "week"] as const).map((d) => (
          <Link
            key={d}
            href={filterUrl({ due: d, page: "1" })}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              due === d
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input text-muted-foreground hover:bg-muted"
            }`}
          >
            {DUE_FILTER_LABEL[d]}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 w-8" />
              <th className="px-4 py-3 font-medium text-muted-foreground">Task</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Priority</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Due</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Client / Account</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Assignee</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((t) => {
                const overdue = isOverdue(t.dueDate) && t.status !== "DONE" && t.status !== "CANCELLED";
                const creditorName =
                  t.debtAccount?.creditor?.name ??
                  t.debtAccount?.originalCreditorName;
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      t.status === "DONE" ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      {t.status !== "DONE" && t.status !== "CANCELLED" && (
                        <CompleteTaskButton taskId={t.id} />
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <Link
                        href={`/tasks/${t.id}/edit`}
                        className="font-medium hover:underline underline-offset-2 truncate block"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${PRIORITY_BADGE[t.priority]}`}>
                        {PRIORITY_LABEL[t.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_BADGE[t.status]}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm whitespace-nowrap ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {formatDate(t.dueDate)}
                      {overdue && <span className="ml-1 text-xs">(overdue)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {t.client ? (
                        <Link
                          href={`/clients/${t.client.id}`}
                          className="hover:underline"
                        >
                          {t.client.firstName} {t.client.lastName}
                        </Link>
                      ) : "—"}
                      {creditorName && (
                        <div className="text-xs mt-0.5">
                          {t.debtAccount && (
                            <Link
                              href={`/accounts/${t.debtAccount.id}`}
                              className="hover:underline"
                            >
                              {creditorName}
                            </Link>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {t.assignedTo?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tasks/${t.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })
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
              <Link href={pageUrl(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageUrl(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
