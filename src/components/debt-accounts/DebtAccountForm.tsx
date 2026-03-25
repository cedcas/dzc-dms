"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDebtAccountAction,
  updateDebtAccountAction,
} from "@/lib/actions/debtAccounts";
import type {
  DebtAccountStatus,
  DelinquencyStage,
} from "@prisma/client";

type CreditorOption = { id: string; name: string };

type AccountData = {
  id?: string;
  clientId: string;
  accountNumber?: string | null;
  originalBalance?: { toString(): string } | null;
  currentBalance?: { toString(): string } | null;
  settledAmount?: { toString(): string } | null;
  status?: DebtAccountStatus;
  delinquencyStage?: DelinquencyStage | null;
  openedAt?: Date | null;
  chargedOffAt?: Date | null;
  settledAt?: Date | null;
  lastContactDate?: Date | null;
  nextFollowUpDate?: Date | null;
  creditorId?: string | null;
  originalCreditorName?: string | null;
};

const STATUS_OPTIONS: { value: DebtAccountStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "IN_NEGOTIATION", label: "In Negotiation" },
  { value: "SETTLED", label: "Settled" },
  { value: "CHARGED_OFF", label: "Charged Off" },
  { value: "DISPUTED", label: "Disputed" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const DELINQUENCY_OPTIONS: { value: DelinquencyStage; label: string }[] = [
  { value: "CURRENT", label: "Current" },
  { value: "LATE_30", label: "30 Days Late" },
  { value: "LATE_60", label: "60 Days Late" },
  { value: "LATE_90", label: "90 Days Late" },
  { value: "LATE_120", label: "120 Days Late" },
  { value: "LATE_180_PLUS", label: "180+ Days Late" },
  { value: "CHARGED_OFF", label: "Charged Off" },
];

const FIELD_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function toDateInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export function DebtAccountForm({
  account,
  creditors,
}: {
  account: AccountData;
  creditors: CreditorOption[];
}) {
  const isEdit = !!account?.id;
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  // Toggle: link to creditor record vs. free-text name
  const [creditorMode, setCreditorMode] = useState<"linked" | "manual">(
    account?.originalCreditorName && !account?.creditorId ? "manual" : "linked"
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    // Clear the field not in use so validator doesn't get both
    if (creditorMode === "linked") {
      formData.delete("originalCreditorName");
    } else {
      formData.delete("creditorId");
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateDebtAccountAction(account!.id!, formData)
        : await createDebtAccountAction(formData);

      if (result?.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  const fe = fieldErrors;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Hidden clientId */}
      <input type="hidden" name="clientId" value={account.clientId} />

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      {/* Creditor section */}
      <div className="space-y-3">
        <Label>Creditor</Label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCreditorMode("linked")}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              creditorMode === "linked"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input text-muted-foreground hover:border-ring"
            }`}
          >
            Link to creditor record
          </button>
          <button
            type="button"
            onClick={() => setCreditorMode("manual")}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              creditorMode === "manual"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input text-muted-foreground hover:border-ring"
            }`}
          >
            Enter name manually
          </button>
        </div>

        {creditorMode === "linked" ? (
          <div className="space-y-1.5">
            <select
              name="creditorId"
              defaultValue={account?.creditorId ?? ""}
              className={FIELD_CLASS}
            >
              <option value="">— Select creditor —</option>
              {creditors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {creditors.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No creditor records yet. Switch to manual entry or{" "}
                <span className="underline">add a creditor first</span>.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Input
              name="originalCreditorName"
              defaultValue={account?.originalCreditorName ?? ""}
              placeholder="e.g. Chase Bank, Capital One…"
            />
            {fe.originalCreditorName && (
              <p className="text-xs text-destructive">
                {fe.originalCreditorName[0]}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Account number */}
      <div className="space-y-1.5">
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input
          id="accountNumber"
          name="accountNumber"
          defaultValue={account?.accountNumber ?? ""}
          placeholder="****1234 (masked)"
        />
        <p className="text-xs text-muted-foreground">
          Store only the last 4 digits or a masked format.
        </p>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="originalBalance">
            Original Balance <span className="text-destructive">*</span>
          </Label>
          <Input
            id="originalBalance"
            name="originalBalance"
            type="number"
            step="0.01"
            min="0"
            defaultValue={account?.originalBalance?.toString() ?? ""}
            placeholder="0.00"
            required
          />
          {fe.originalBalance && (
            <p className="text-xs text-destructive">{fe.originalBalance[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentBalance">
            Current Balance <span className="text-destructive">*</span>
          </Label>
          <Input
            id="currentBalance"
            name="currentBalance"
            type="number"
            step="0.01"
            min="0"
            defaultValue={account?.currentBalance?.toString() ?? ""}
            placeholder="0.00"
            required
          />
          {fe.currentBalance && (
            <p className="text-xs text-destructive">{fe.currentBalance[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settledAmount">Settled Amount</Label>
          <Input
            id="settledAmount"
            name="settledAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={account?.settledAmount?.toString() ?? ""}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Status + Delinquency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="status">
            Status <span className="text-destructive">*</span>
          </Label>
          <select
            id="status"
            name="status"
            defaultValue={account?.status ?? "ACTIVE"}
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
          <Label htmlFor="delinquencyStage">Delinquency Stage</Label>
          <select
            id="delinquencyStage"
            name="delinquencyStage"
            defaultValue={account?.delinquencyStage ?? ""}
            className={FIELD_CLASS}
          >
            <option value="">— None —</option>
            {DELINQUENCY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Follow-up dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lastContactDate">Last Contact Date</Label>
          <Input
            id="lastContactDate"
            name="lastContactDate"
            type="date"
            defaultValue={toDateInputValue(account?.lastContactDate)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nextFollowUpDate">Next Follow-Up Date</Label>
          <Input
            id="nextFollowUpDate"
            name="nextFollowUpDate"
            type="date"
            defaultValue={toDateInputValue(account?.nextFollowUpDate)}
          />
        </div>
      </div>

      {/* Account dates */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="openedAt">Account Opened</Label>
          <Input
            id="openedAt"
            name="openedAt"
            type="date"
            defaultValue={toDateInputValue(account?.openedAt)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chargedOffAt">Charged Off</Label>
          <Input
            id="chargedOffAt"
            name="chargedOffAt"
            type="date"
            defaultValue={toDateInputValue(account?.chargedOffAt)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settledAt">Settled Date</Label>
          <Input
            id="settledAt"
            name="settledAt"
            type="date"
            defaultValue={toDateInputValue(account?.settledAt)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save Changes"
              : "Add Account"}
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
