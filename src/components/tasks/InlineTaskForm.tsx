"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createTaskAction } from "@/lib/actions/tasks";

type UserOption = { id: string; name: string };

const FIELD_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function InlineTaskForm({
  debtAccountId,
  clientId,
  users,
}: {
  debtAccountId: string;
  clientId: string;
  users: UserOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createTaskAction(formData);

      if (result?.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      } else {
        setFormKey((k) => k + 1);
        router.refresh();
      }
    });
  }

  const fe = fieldErrors;

  return (
    <div className="px-5 py-4 border-b bg-muted/20">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Add Task
      </p>

      <form key={formKey} onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="debtAccountId" value={debtAccountId} />
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="status" value="TODO" />

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="itf-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <input
            id="itf-title"
            name="title"
            type="text"
            required
            placeholder="e.g. Follow up on counter-offer"
            className={FIELD_CLASS}
          />
          {fe.title && (
            <p className="text-xs text-destructive">{fe.title[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="itf-priority">Priority</Label>
            <select
              id="itf-priority"
              name="priority"
              defaultValue="MEDIUM"
              className={FIELD_CLASS}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="itf-dueDate">Due Date</Label>
            <input
              id="itf-dueDate"
              name="dueDate"
              type="date"
              defaultValue={today}
              className={FIELD_CLASS}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="itf-assignedToId">Assignee</Label>
            <select
              id="itf-assignedToId"
              name="assignedToId"
              defaultValue=""
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

        <div>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Adding…" : "Add Task"}
          </Button>
        </div>
      </form>
    </div>
  );
}
