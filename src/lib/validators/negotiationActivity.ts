import { z } from "zod";

function optionalStr(v: unknown) {
  return typeof v === "string" && v.trim() === "" ? undefined : v;
}

function parseOptionalDate(v: unknown) {
  if (typeof v === "string" && v === "") return undefined;
  if (v) return new Date(v as string);
  return undefined;
}

function parseDate(v: unknown) {
  if (typeof v === "string" && v !== "") return new Date(v);
  return undefined;
}

function parseBooleanFlag(v: unknown) {
  return v === "on" || v === "true" || v === true;
}

export const CONTACT_TYPES = new Set([
  "CALL",
  "VOICEMAIL",
  "EMAIL",
  "LETTER",
  "SETTLEMENT_DISCUSSION",
]);

export const activitySchema = z.object({
  debtAccountId: z.string().min(1, "Account is required"),
  type: z.enum([
    "CALL",
    "VOICEMAIL",
    "EMAIL",
    "LETTER",
    "INTERNAL_NOTE",
    "CLIENT_UPDATE",
    "SETTLEMENT_DISCUSSION",
    "STATUS_CHANGE",
    "OFFER_SENT",
    "OFFER_RECEIVED",
  ]),
  notes: z.string().min(1, "Notes are required"),
  occurredAt: z.preprocess(
    parseDate,
    z.date({ required_error: "Date is required" })
  ),
  nextActionDate: z.preprocess(parseOptionalDate, z.date().optional()),
  createFollowUpTask: z.preprocess(parseBooleanFlag, z.boolean()).optional(),
  // passed through to action but not stored on the activity
  accountClientId: z.preprocess(optionalStr, z.string().optional()),
});

export type ActivityInput = z.infer<typeof activitySchema>;
