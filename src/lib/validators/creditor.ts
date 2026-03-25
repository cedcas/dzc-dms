import { z } from "zod";

function optionalStr(v: unknown) {
  return typeof v === "string" && v.trim() === "" ? undefined : v;
}

export const creditorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.preprocess(
    optionalStr,
    z.enum(["ORIGINAL_CREDITOR", "COLLECTION_AGENCY", "LAW_FIRM", "DEBT_BUYER", "OTHER"]).optional()
  ),
  phone: z.preprocess(optionalStr, z.string().optional()),
  email: z.preprocess(
    optionalStr,
    z.string().email("Invalid email address").optional()
  ),
  address: z.preprocess(optionalStr, z.string().optional()),
  website: z.preprocess(optionalStr, z.string().optional()),
  preferredChannel: z.preprocess(
    optionalStr,
    z.enum(["PHONE", "EMAIL", "FAX", "MAIL", "PORTAL", "OTHER"]).optional()
  ),
  notes: z.preprocess(optionalStr, z.string().optional()),
  isActive: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean().default(true)
  ),
});

export type CreditorInput = z.infer<typeof creditorSchema>;
