"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCreditorAction, updateCreditorAction } from "@/lib/actions/creditors";
import type { CreditorType, ContactChannel } from "@prisma/client";

type CreditorData = {
  id?: string;
  name?: string;
  type?: CreditorType | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  preferredChannel?: ContactChannel | null;
  notes?: string | null;
  isActive?: boolean;
};

const TYPE_OPTIONS: { value: CreditorType; label: string }[] = [
  { value: "ORIGINAL_CREDITOR", label: "Original Creditor" },
  { value: "COLLECTION_AGENCY", label: "Collection Agency" },
  { value: "LAW_FIRM", label: "Law Firm" },
  { value: "DEBT_BUYER", label: "Debt Buyer" },
  { value: "OTHER", label: "Other" },
];

const CHANNEL_OPTIONS: { value: ContactChannel; label: string }[] = [
  { value: "PHONE", label: "Phone" },
  { value: "EMAIL", label: "Email" },
  { value: "FAX", label: "Fax" },
  { value: "MAIL", label: "Mail" },
  { value: "PORTAL", label: "Online Portal" },
  { value: "OTHER", label: "Other" },
];

const FIELD_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y";

export function CreditorForm({ creditor }: { creditor?: CreditorData }) {
  const isEdit = !!creditor?.id;
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
        ? await updateCreditorAction(creditor!.id!, formData)
        : await createCreditorAction(formData);

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

      {/* Name + Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={creditor?.name ?? ""}
            placeholder="e.g. Portfolio Recovery Associates"
            required
          />
          {fe.name && (
            <p className="text-xs text-destructive">{fe.name[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            defaultValue={creditor?.type ?? ""}
            className={FIELD_CLASS}
          >
            <option value="">— Select type —</option>
            {TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={creditor?.phone ?? ""}
            placeholder="(800) 000-0000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={creditor?.email ?? ""}
            placeholder="disputes@creditor.com"
          />
          {fe.email && (
            <p className="text-xs text-destructive">{fe.email[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            defaultValue={creditor?.website ?? ""}
            placeholder="https://creditor.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferredChannel">Preferred Contact Channel</Label>
          <select
            id="preferredChannel"
            name="preferredChannel"
            defaultValue={creditor?.preferredChannel ?? ""}
            className={FIELD_CLASS}
          >
            <option value="">— None specified —</option>
            {CHANNEL_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Mailing Address</Label>
        <textarea
          id="address"
          name="address"
          defaultValue={creditor?.address ?? ""}
          rows={2}
          placeholder="PO Box 1234, City, ST 00000"
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={creditor?.notes ?? ""}
          rows={4}
          placeholder="Negotiation tactics, escalation contacts, known settlement thresholds, special procedures…"
          className={TEXTAREA_CLASS}
        />
      </div>

      {/* Active toggle (edit only) */}
      {isEdit && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            value="true"
            defaultChecked={creditor?.isActive ?? true}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Active
          </Label>
          <p className="text-xs text-muted-foreground">
            Inactive creditors are hidden from account linking dropdowns.
          </p>
        </div>
      )}

      {!isEdit && (
        <input type="hidden" name="isActive" value="true" />
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save Changes"
              : "Add Creditor"}
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
