"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createOfferAction,
  updateOfferStatusAction,
} from "@/lib/actions/offers";

const FIELD_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y";

// ─── Create Form ─────────────────────────────────────────────────────────────

export function OfferForm({ debtAccountId }: { debtAccountId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [paymentType, setPaymentType] = useState("LUMP_SUM");
  const [status, setStatus] = useState("PENDING");
  const [conflictAccepted, setConflictAccepted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setConflictAccepted(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createOfferAction(formData);

      if (result?.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        if (result.conflictAccepted) setConflictAccepted(true);
      } else {
        setPaymentType("LUMP_SUM");
        setStatus("PENDING");
        setConflictAccepted(false);
        setFormKey((k) => k + 1);
        router.refresh();
      }
    });
  }

  const fe = fieldErrors;

  return (
    <div className="px-5 py-4 border-b bg-muted/20">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Record Offer
      </p>

      <form key={formKey} onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="debtAccountId" value={debtAccountId} />

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Direction */}
          <div className="space-y-1">
            <Label htmlFor="offer-direction">
              Direction <span className="text-destructive">*</span>
            </Label>
            <select
              id="offer-direction"
              name="direction"
              defaultValue="OUTGOING"
              className={FIELD_CLASS}
            >
              <option value="OUTGOING">We sent to creditor</option>
              <option value="INCOMING">Received from creditor</option>
            </select>
            {fe.direction && (
              <p className="text-xs text-destructive">{fe.direction[0]}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label htmlFor="offer-status">
              Status <span className="text-destructive">*</span>
            </Label>
            <select
              id="offer-status"
              name="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setConflictAccepted(false);
                setError(null);
              }}
              className={FIELD_CLASS}
            >
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="COUNTERED">Countered</option>
              <option value="EXPIRED">Expired</option>
            </select>
            {fe.status && (
              <p className="text-xs text-destructive">{fe.status[0]}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="offer-amount">
              Amount ($) <span className="text-destructive">*</span>
            </Label>
            <input
              id="offer-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className={FIELD_CLASS}
              required
            />
            {fe.amount && (
              <p className="text-xs text-destructive">{fe.amount[0]}</p>
            )}
          </div>

          {/* Percent of balance */}
          <div className="space-y-1">
            <Label htmlFor="offer-pct">% of Balance</Label>
            <input
              id="offer-pct"
              name="percentOfBalance"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g. 45.00"
              className={FIELD_CLASS}
            />
            {fe.percentOfBalance && (
              <p className="text-xs text-destructive">{fe.percentOfBalance[0]}</p>
            )}
          </div>

          {/* Expiration */}
          <div className="space-y-1">
            <Label htmlFor="offer-expires">Expires</Label>
            <input
              id="offer-expires"
              name="expiresAt"
              type="date"
              className={FIELD_CLASS}
            />
            {fe.expiresAt && (
              <p className="text-xs text-destructive">{fe.expiresAt[0]}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Source */}
          <div className="space-y-1">
            <Label htmlFor="offer-source">Source / Contact</Label>
            <input
              id="offer-source"
              name="source"
              type="text"
              placeholder="Creditor rep name, dept., etc."
              className={FIELD_CLASS}
            />
            {fe.source && (
              <p className="text-xs text-destructive">{fe.source[0]}</p>
            )}
          </div>

          {/* Payment type */}
          <div className="space-y-1">
            <Label htmlFor="offer-paymentType">
              Payment Type <span className="text-destructive">*</span>
            </Label>
            <select
              id="offer-paymentType"
              name="paymentType"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="LUMP_SUM">Lump Sum</option>
              <option value="INSTALLMENT">Installment Plan</option>
            </select>
          </div>
        </div>

        {/* Installment fields — only shown when INSTALLMENT */}
        {paymentType === "INSTALLMENT" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="offer-installCount">
                # of Payments <span className="text-destructive">*</span>
              </Label>
              <input
                id="offer-installCount"
                name="installmentCount"
                type="number"
                min="2"
                placeholder="e.g. 12"
                className={FIELD_CLASS}
              />
              {fe.installmentCount && (
                <p className="text-xs text-destructive">{fe.installmentCount[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="offer-installFreq">Frequency</Label>
              <input
                id="offer-installFreq"
                name="installmentFreq"
                type="text"
                placeholder="Monthly, Weekly, etc."
                className={FIELD_CLASS}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1">
          <Label htmlFor="offer-notes">Notes</Label>
          <textarea
            id="offer-notes"
            name="notes"
            rows={2}
            placeholder="Reference numbers, conditions, verbal terms…"
            className={TEXTAREA_CLASS}
          />
        </div>

        {/* Replace-accepted confirmation — only shown when conflict was returned */}
        {conflictAccepted && (
          <div className="flex items-center gap-2">
            <input
              id="offer-replaceAccepted"
              name="replaceAccepted"
              type="checkbox"
              value="on"
              className="h-4 w-4 rounded border-input accent-ring"
            />
            <Label
              htmlFor="offer-replaceAccepted"
              className="text-sm font-normal cursor-pointer text-destructive"
            >
              Replace the existing accepted offer (it will be marked Countered)
            </Label>
          </div>
        )}

        <div>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving…" : "Save Offer"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Inline accept / status-change button ───────────────────────────────────

export function AcceptOfferButton({
  offerId,
  debtAccountId,
  currentStatus,
}: {
  offerId: string;
  debtAccountId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  if (currentStatus === "ACCEPTED") {
    return (
      <span className="text-xs text-green-700 font-medium">Accepted</span>
    );
  }

  function accept(replace = false) {
    setError(null);
    startTransition(async () => {
      const result = await updateOfferStatusAction(offerId, "ACCEPTED", replace);
      if (result?.error) {
        setError(result.error);
        if (result.conflictAccepted) setNeedsConfirm(true);
      } else {
        setNeedsConfirm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-1">
      {error && <p className="text-xs text-destructive">{error}</p>}
      {needsConfirm ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => accept(true)}
            disabled={isPending}
            className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
          >
            {isPending ? "…" : "Replace & Accept"}
          </button>
          <button
            type="button"
            onClick={() => setNeedsConfirm(false)}
            className="text-xs text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => accept(false)}
          disabled={isPending}
          className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
        >
          {isPending ? "…" : "Accept"}
        </button>
      )}
    </div>
  );
}
