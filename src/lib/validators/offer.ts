import { z } from "zod";

function optionalStr(v: unknown) {
  if (v == null) return undefined;
  return typeof v === "string" && v.trim() === "" ? undefined : v;
}

function parseOptionalDate(v: unknown) {
  if (typeof v === "string" && v === "") return undefined;
  if (v) return new Date(v as string);
  return undefined;
}

function parseDecimal(v: unknown) {
  if (v == null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function parseOptionalInt(v: unknown) {
  if (v == null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  const n = parseInt(v as string, 10);
  return isNaN(n) ? undefined : n;
}

function parseBooleanFlag(v: unknown) {
  return v === "on" || v === "true" || v === true;
}

export const offerSchema = z
  .object({
    debtAccountId: z.string().min(1, "Account is required"),
    direction: z.enum(["OUTGOING", "INCOMING"]),
    amount: z.preprocess(
      parseDecimal,
      z.number().min(0.01, "Amount must be > 0")
    ),
    percentOfBalance: z.preprocess(
      parseDecimal,
      z.number().min(0).max(100).optional()
    ),
    source: z.preprocess(optionalStr, z.string().optional()),
    paymentType: z.enum(["LUMP_SUM", "INSTALLMENT"]),
    installmentCount: z.preprocess(
      parseOptionalInt,
      z.number().int().min(2, "Must be at least 2 payments").optional()
    ),
    installmentFreq: z.preprocess(optionalStr, z.string().optional()),
    status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "COUNTERED", "EXPIRED"]),
    expiresAt: z.preprocess(parseOptionalDate, z.date().optional()),
    notes: z.preprocess(optionalStr, z.string().optional()),
    // When accepting and a previous accepted offer exists, pass true to replace it
    replaceAccepted: z.preprocess(parseBooleanFlag, z.boolean()).optional(),
  })
  .refine(
    (d) => d.paymentType !== "INSTALLMENT" || d.installmentCount != null,
    {
      message: "Number of payments is required for installment offers.",
      path: ["installmentCount"],
    }
  );

export type OfferInput = z.infer<typeof offerSchema>;
