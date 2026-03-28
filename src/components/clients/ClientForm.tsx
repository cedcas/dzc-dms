"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientAction, updateClientAction } from "@/lib/actions/clients";
import type { ClientStatus } from "@prisma/client";
import { FIELD_CLASS, TEXTAREA_CLASS } from "@/lib/ui-classes";

type UserOption = { id: string; name: string };

type ClientData = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: ClientStatus;
  programStartDate?: Date | null;
  notes?: string | null;
  handlerId?: string | null;
};

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "ACTIVE", label: "Active" },
  { value: "GRADUATED", label: "Graduated" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "DEFAULTED", label: "Defaulted" },
];


export function ClientForm({
  client,
  users,
}: {
  client?: ClientData;
  users: UserOption[];
}) {
  const isEdit = !!client?.id;
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
        ? await updateClientAction(client!.id!, formData)
        : await createClientAction(formData);

      if (result?.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={client?.firstName}
            placeholder="Jane"
            required
          />
          {fe.firstName && (
            <p className="text-xs text-destructive">{fe.firstName[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={client?.lastName}
            placeholder="Doe"
            required
          />
          {fe.lastName && (
            <p className="text-xs text-destructive">{fe.lastName[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            placeholder="jane@example.com"
          />
          {fe.email && (
            <p className="text-xs text-destructive">{fe.email[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={client?.phone ?? ""}
            placeholder="(555) 000-0000"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <textarea
          id="address"
          name="address"
          defaultValue={client?.address ?? ""}
          rows={2}
          placeholder="123 Main St, City, ST 00000"
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="status">
            Status <span className="text-destructive">*</span>
          </Label>
          <select
            id="status"
            name="status"
            defaultValue={client?.status ?? "ONBOARDING"}
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
          <Label htmlFor="programStartDate">Program Start Date</Label>
          <Input
            id="programStartDate"
            name="programStartDate"
            type="date"
            defaultValue={
              client?.programStartDate
                ? new Date(client.programStartDate).toISOString().split("T")[0]
                : ""
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="handlerId">Assigned Owner</Label>
        <select
          id="handlerId"
          name="handlerId"
          defaultValue={client?.handlerId ?? ""}
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

      <div className="space-y-1.5">
        <Label htmlFor="notes">Hardship Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={client?.notes ?? ""}
          rows={5}
          placeholder="Document the client's hardship situation, income, expenses, and relevant background…"
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save Changes"
              : "Create Client"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
