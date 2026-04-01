"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserAction, updateUserAction } from "@/lib/actions/users";
import type { UserRole } from "@prisma/client";
import { FIELD_CLASS, SELECT_CLASS } from "@/lib/ui-classes";

type UserData = {
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "NEGOTIATOR", label: "Negotiator" },
  { value: "INTAKE", label: "Intake" },
  { value: "READ_ONLY", label: "Read Only" },
];

export function UserForm({ user }: { user?: UserData }) {
  const isEdit = !!user?.id;
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
        ? await updateUserAction(user!.id!, formData)
        : await createUserAction(formData);

      if (result?.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  const fe = fieldErrors;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={user?.name ?? ""}
          placeholder="Jane Smith"
          className={FIELD_CLASS}
          disabled={isPending}
        />
        {fe.name && <p className="text-xs text-destructive">{fe.name[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user?.email ?? ""}
          placeholder="jane@example.com"
          className={FIELD_CLASS}
          disabled={isPending}
        />
        {fe.email && <p className="text-xs text-destructive">{fe.email[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">
          Password {isEdit ? "(leave blank to keep current)" : <span className="text-destructive">*</span>}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={isEdit ? "••••••••" : "Min 8 characters"}
          className={FIELD_CLASS}
          disabled={isPending}
        />
        {fe.password && <p className="text-xs text-destructive">{fe.password[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">
          Role <span className="text-destructive">*</span>
        </Label>
        <select
          id="role"
          name="role"
          defaultValue={user?.role ?? "NEGOTIATOR"}
          className={`${SELECT_CLASS} w-full`}
          disabled={isPending}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {fe.role && <p className="text-xs text-destructive">{fe.role[0]}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          value="true"
          defaultChecked={user?.isActive ?? true}
          className="h-4 w-4 rounded border-input"
          disabled={isPending}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Active account
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
        </Button>
        <a href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground transition-colors self-center">
          Cancel
        </a>
      </div>
    </form>
  );
}
