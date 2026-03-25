import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { TaskForm } from "@/components/tasks/TaskForm";

export const metadata = { title: "New Task — DZC DMS" };

export default async function NewTaskPage() {
  await requireAuth();

  const [users, clients, accounts] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Task</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create a new follow-up task.
        </p>
      </div>
      <TaskForm users={users} clients={clients} accounts={accounts} />
    </div>
  );
}
