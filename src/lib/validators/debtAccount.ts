import { z } from "zod";

function optionalStr(v: unknown) {
  if (v === null) return undefined;
  return typeof v === "string" && v.trim() === "" ? undefined : v;
}


function parseOptionalDate(v: unknown) {
  if (typeof v === "string" && v === "") return undefined;
  if (v) return new Date(v as string);
  return undefined;
}

function parseDecimal(v: unknown) {
  if (v === null || (typeof v === "string" && v.trim() === "")) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export const debtAccountSchema = z
  .object({
    clientId: z.string().min(1, "Client is required"),
    accountNumber: z.preprocess(optionalStr, z.string().optional()),
    originalBalance: z.preprocess(
      parseDecimal,
      z.number().min(0, "Original balance must be ≥ 0")
    ),
    currentBalance: z.preprocess(
      parseDecimal,
      z.number().min(0, "Current balance must be ≥ 0")
    ),
    settledAmount: z.preprocess(
      parseDecimal,
      z.number().min(0, "Must be ≥ 0").optional()
    ),
    status: z.enum([
      "ACTIVE",
      "IN_NEGOTIATION",
      "SETTLED",
      "CHARGED_OFF",
      "DISPUTED",
      "WITHDRAWN",
    ]),
    delinquencyStage: z.preprocess(
      optionalStr,
      z
        .enum([
          "CURRENT",
          "LATE_30",
          "LATE_60",
          "LATE_90",
          "LATE_120",
          "LATE_180_PLUS",
          "CHARGED_OFF",
        ])
        .optional()
    ),
    openedAt: z.preprocess(parseOptionalDate, z.date().optional()),
    chargedOffAt: z.preprocess(parseOptionalDate, z.date().optional()),
    settledAt: z.preprocess(parseOptionalDate, z.date().optional()),
    lastContactDate: z.preprocess(parseOptionalDate, z.date().optional()),
    nextFollowUpDate: z.preprocess(parseOptionalDate, z.date().optional()),
    // Creditor: either link to existing record OR free-text name
    creditorId: z.preprocess(optionalStr, z.string().optional()),
    originalCreditorName: z.preprocess(optionalStr, z.string().optional()),
  })
  .refine(
    (d) => d.creditorId || d.originalCreditorName,
    {
      message: "Provide a creditor name or select a creditor record.",
      path: ["originalCreditorName"],
    }
  );

export type DebtAccountInput = z.infer<typeof debtAccountSchema>;
