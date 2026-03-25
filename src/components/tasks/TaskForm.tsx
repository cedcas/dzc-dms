"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTaskAction, updateTaskAction } from "@/lib/actions/tasks";
import type { TaskStatus, TaskPriority } from "@prisma/client";

type UserOption = { id: string; name: string };
type ClientOption = { id: string; firstName: string; lastName: string };
type AccountOption = { id: string; creditor: { name: string } | null; originalCreditorName: string | null };

type TaskData = {
  id?: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  clientId?: string | null;
  debtAccountId?: string | null;
  assignedToId?: string | null;
};

const FIELD_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function TaskForm({
  task,
  users,
  clients,
  accounts,
  returnTo,
}: {
  task?: TaskData;
  users: UserOption[];
  clients?: ClientOption[];
  accounts?: AccountOption[];
  returnTo?: string;
}) {
  const router = useRouter();
  const isEdit = !!task?.id;
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateTaskAction(task!.id!, formData)
        : await createTaskAction(formData);

      if (result?.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      } else {
        router.push(returnTo ?? "/tasks");
      }
    });
  }

  const fe = fieldErrors;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          defaultValue={task?.title ?? ""}
          placeholder="e.g. Follow up on settlement offer"
          required
        />
        {fe.title && <p className="text-xs text-destructive">{fe.title[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={task?.description ?? ""}
          rows={3}
          placeholder="Additional context, steps, or notes…"
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={task?.status ?? "TODO"}
            className={FIELD_CLASS}
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={task?.priority ?? "MEDIUM"}
            className={FIELD_CLASS}
          >
            {PRIORITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date</Label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={
              task?.dueDate
                ? new Date(task.dueDate).toISOString().split("T")[0]
                : ""
            }
            className={FIELD_CLASS}
          />
          {fe.dueDate && (
            <p className="text-xs text-destructive">{fe.dueDate[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assignedToId">Assignee</Label>
          <select
            id="assignedToId"
            name="assignedToId"
            defaultValue={task?.assignedToId ?? ""}
            className={FIELD_CLASS}
          >
            <option value="">— Unassigned —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {clients && clients.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="clientId">Client</Label>
          <select
            id="clientId"
            name="clientId"
            defaultValue={task?.clientId ?? ""}
            className={FIELD_CLASS}
          >
            <option value="">— None —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {accounts && accounts.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="debtAccountId">Debt Account</Label>
          <select
            id="debtAccountId"
            name="debtAccountId"
            defaultValue={task?.debtAccountId ?? ""}
            className={FIELD_CLASS}
          >
            <option value="">— None —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.creditor?.name ?? a.originalCreditorName ?? "Unknown"}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit ? "Saving…" : "Creating…"
            : isEdit ? "Save Changes" : "Create Task"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(returnTo ?? "/tasks")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
