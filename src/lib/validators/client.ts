import { z } from "zod";

function optionalStr(v: unknown) {
  return typeof v === "string" && v.trim() === "" ? undefined : v;
}

export const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.preprocess(
    optionalStr,
    z.string().email("Invalid email address").optional()
  ),
  phone: z.preprocess(optionalStr, z.string().optional()),
  address: z.preprocess(optionalStr, z.string().optional()),
  status: z.enum(["ONBOARDING", "ACTIVE", "GRADUATED", "WITHDRAWN", "DEFAULTED"]),
  programStartDate: z.preprocess(
    (v) =>
      typeof v === "string" && v === "" ? undefined : v ? new Date(v as string) : undefined,
    z.date().optional()
  ),
  notes: z.preprocess(optionalStr, z.string().optional()),
  handlerId: z.preprocess(optionalStr, z.string().optional()),
});

export type ClientInput = z.infer<typeof clientSchema>;
