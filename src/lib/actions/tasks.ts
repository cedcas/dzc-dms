"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { taskSchema } from "@/lib/validators/task";
import { writeAuditLog } from "@/lib/audit";

export type TaskActionResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    clientId: formData.get("clientId"),
    debtAccountId: formData.get("debtAccountId"),
    assignedToId: formData.get("assignedToId"),
  };
}

function revalidateTaskPaths(debtAccountId?: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (debtAccountId) revalidatePath(`/accounts/${debtAccountId}`);
}

export async function createTaskAction(
  formData: FormData
): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = taskSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const task = await prisma.task.create({
      data: {
        ...parsed.data,
        createdById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Task",
      entityId: task.id,
      after: {
        title: parsed.data.title,
        status: parsed.data.status,
        priority: parsed.data.priority,
        assignedToId: parsed.data.assignedToId,
        clientId: parsed.data.clientId,
        debtAccountId: parsed.data.debtAccountId,
      },
    });

    revalidateTaskPaths(parsed.data.debtAccountId);
  } catch (err) {
    console.error("[createTaskAction]", err);
    return { error: "Failed to create task. Please try again." };
  }
}

export async function updateTaskAction(
  id: string,
  formData: FormData
): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = taskSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const before = await prisma.task.findUnique({
      where: { id },
      select: { title: true, status: true, priority: true, assignedToId: true, dueDate: true },
    });
    if (!before) return { error: "Task not found." };

    const task = await prisma.task.update({
      where: { id },
      data: parsed.data,
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Task",
      entityId: id,
      before: {
        title: before.title,
        status: before.status,
        priority: before.priority,
        assignedToId: before.assignedToId,
        dueDate: before.dueDate,
      },
      after: {
        title: parsed.data.title,
        status: parsed.data.status,
        priority: parsed.data.priority,
        assignedToId: parsed.data.assignedToId,
        dueDate: parsed.data.dueDate,
      },
    });

    revalidateTaskPaths(task.debtAccountId);
  } catch (err) {
    console.error("[updateTaskAction]", err);
    return { error: "Failed to update task. Please try again." };
  }
}

export async function completeTaskAction(
  id: string
): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const before = await prisma.task.findUnique({
      where: { id },
      select: { status: true, debtAccountId: true },
    });
    if (!before) return { error: "Task not found." };

    await prisma.task.update({ where: { id }, data: { status: "DONE" } });

    await writeAuditLog({
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entityType: "Task",
      entityId: id,
      before: { status: before.status },
      after: { status: "DONE" },
    });

    revalidateTaskPaths(before.debtAccountId);
  } catch (err) {
    console.error("[completeTaskAction]", err);
    return { error: "Failed to complete task." };
  }
}
