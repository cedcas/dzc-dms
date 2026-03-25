import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/tasks/TaskForm";
import Link from "next/link";

export const metadata = { title: "Edit Task — DZC DMS" };

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const [task, users, clients, accounts] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        clientId: true,
        debtAccountId: true,
        assignedToId: true,
        debtAccount: {
          select: { id: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: { status: { in: ["ACTIVE", "ONBOARDING"] } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.debtAccount.findMany({
      where: { status: { in: ["ACTIVE", "IN_NEGOTIATION"] } },
      select: {
        id: true,
        originalCreditorName: true,
        creditor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  if (!task) notFound();

  const returnTo = task.debtAccount
    ? `/accounts/${task.debtAccount.id}`
    : "/tasks";

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-xs text-muted-foreground mb-1">
          <Link href="/tasks" className="hover:underline">
            Tasks
          </Link>{" "}
          /
        </nav>
        <h1 className="text-2xl font-semibold">Edit Task</h1>
      </div>
      <TaskForm
        task={task}
        users={users}
        clients={clients}
        accounts={accounts}
        returnTo={returnTo}
      />
    </div>
  );
}
