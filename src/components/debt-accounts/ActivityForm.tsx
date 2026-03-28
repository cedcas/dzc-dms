"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createActivityAction } from "@/lib/actions/negotiationActivities";
import { FIELD_CLASS, TEXTAREA_CLASS } from "@/lib/ui-classes";


const ACTIVITY_TYPE_OPTIONS = [
  { value: "CALL", label: "Phone Call" },
  { value: "VOICEMAIL", label: "Voicemail" },
  { value: "EMAIL", label: "Email" },
  { value: "LETTER", label: "Mailed Letter" },
  { value: "INTERNAL_NOTE", label: "Internal Note" },
  { value: "CLIENT_UPDATE", label: "Client Update" },
  { value: "SETTLEMENT_DISCUSSION", label: "Settlement Discussion" },
  { value: "OFFER_SENT", label: "Offer Sent" },
  { value: "OFFER_RECEIVED", label: "Offer Received" },
  { value: "STATUS_CHANGE", label: "Status Change" },
];

export function ActivityForm({
  debtAccountId,
  clientId,
}: {
  debtAccountId: string;
  clientId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [nextActionDate, setNextActionDate] = useState("");
  const [formKey, setFormKey] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createActivityAction(formData);

      if (result?.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      } else {
        // Success — reset the form and refresh Server Component data
        setNextActionDate("");
        setFormKey((k) => k + 1);
        router.refresh();
      }
    });
  }

  const fe = fieldErrors;

  return (
    <div className="px-5 py-4 border-b bg-muted/20">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Log Activity
      </p>

      <form key={formKey} onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="debtAccountId" value={debtAccountId} />
        <input type="hidden" name="accountClientId" value={clientId} />

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="act-type">
              Type <span className="text-destructive">*</span>
            </Label>
            <select id="act-type" name="type" defaultValue="CALL" className={FIELD_CLASS}>
              {ACTIVITY_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {fe.type && <p className="text-xs text-destructive">{fe.type[0]}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="act-occurredAt">
              Date <span className="text-destructive">*</span>
            </Label>
            <input
              id="act-occurredAt"
              name="occurredAt"
              type="date"
              defaultValue={today}
              className={FIELD_CLASS}
              required
            />
            {fe.occurredAt && (
              <p className="text-xs text-destructive">{fe.occurredAt[0]}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="act-notes">
            Notes <span className="text-destructive">*</span>
          </Label>
          <textarea
            id="act-notes"
            name="notes"
            rows={3}
            required
            placeholder="What happened? Include creditor rep name, reference numbers, key points discussed…"
            className={TEXTAREA_CLASS}
          />
          {fe.notes && <p className="text-xs text-destructive">{fe.notes[0]}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="act-nextActionDate">Next Action Date</Label>
            <input
              id="act-nextActionDate"
              name="nextActionDate"
              type="date"
              value={nextActionDate}
              onChange={(e) => setNextActionDate(e.target.value)}
              className={FIELD_CLASS}
            />
            {fe.nextActionDate && (
              <p className="text-xs text-destructive">{fe.nextActionDate[0]}</p>
            )}
          </div>

          {nextActionDate && (
            <div className="flex items-center gap-2 pb-1">
              <input
                id="act-createTask"
                name="createFollowUpTask"
                type="checkbox"
                value="on"
                className="h-4 w-4 rounded border-input accent-ring"
              />
              <Label htmlFor="act-createTask" className="text-sm font-normal cursor-pointer">
                Auto-create follow-up task
              </Label>
            </div>
          )}
        </div>

        <div>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving…" : "Log Activity"}
          </Button>
        </div>
      </form>
    </div>
  );
}
