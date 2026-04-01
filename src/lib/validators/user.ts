import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "NEGOTIATOR", "INTAKE", "READ_ONLY"]),
  isActive: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean().default(true)
  ),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "NEGOTIATOR", "INTAKE", "READ_ONLY"]),
  isActive: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean().default(true)
  ),
  password: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(8, "Password must be at least 8 characters").optional()
  ),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
