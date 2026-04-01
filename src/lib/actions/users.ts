"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createUserSchema, updateUserSchema } from "@/lib/validators/user";
import { writeAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

export type UserActionResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}

export async function createUserAction(formData: FormData): Promise<UserActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized. Admin access required." };

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    isActive: formData.get("isActive") ?? "true",
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return { error: "A user with this email already exists." };

    const hashed = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashed,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      after: { name: user.name, email: user.email, role: user.role },
    });

    revalidatePath("/admin/users");
    redirect("/admin/users");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[createUserAction]", err);
    return { error: "Failed to create user. Please try again." };
  }
}

export async function updateUserAction(
  userId: string,
  formData: FormData
): Promise<UserActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized. Admin access required." };

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    isActive: formData.get("isActive") ?? "false",
  };

  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return { error: "User not found." };

    // Check email uniqueness if changed
    if (parsed.data.email !== existing.email) {
      const conflict = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (conflict) return { error: "A user with this email already exists." };
    }

    const updateData: Parameters<typeof prisma.user.update>[0]["data"] = {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    };

    if (parsed.data.password) {
      updateData.password = await bcrypt.hash(parsed.data.password, 12);
    }

    const before = { name: existing.name, email: existing.email, role: existing.role, isActive: existing.isActive };
    const updated = await prisma.user.update({ where: { id: userId }, data: updateData });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      before,
      after: { name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive },
    });

    revalidatePath("/admin/users");
    redirect("/admin/users");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[updateUserAction]", err);
    return { error: "Failed to update user. Please try again." };
  }
}
