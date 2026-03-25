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

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.preprocess(optionalStr, z.string().optional()),
  status: z
    .enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"])
    .default("TODO"),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .default("MEDIUM"),
  dueDate: z.preprocess(parseOptionalDate, z.date().optional()),
  clientId: z.preprocess(optionalStr, z.string().optional()),
  debtAccountId: z.preprocess(optionalStr, z.string().optional()),
  assignedToId: z.preprocess(optionalStr, z.string().optional()),
});

export type TaskInput = z.infer<typeof taskSchema>;
