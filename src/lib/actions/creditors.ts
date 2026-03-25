"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creditorSchema } from "@/lib/validators/creditor";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { writeAuditLog } from "@/lib/audit";

export type CreditorActionResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    type: formData.get("type"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    website: formData.get("website"),
    preferredChannel: formData.get("preferredChannel"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive"),
  };
}

export async function createCreditorAction(
  formData: FormData
): Promise<CreditorActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = creditorSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const creditor = await prisma.creditor.create({ data: parsed.data });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Creditor",
      entityId: creditor.id,
      after: parsed.data,
    });

    revalidatePath("/creditors");
    redirect(`/creditors/${creditor.id}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[createCreditorAction]", err);
    return { error: "Failed to create creditor. Please try again." };
  }
}

export async function updateCreditorAction(
  id: string,
  formData: FormData
): Promise<CreditorActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = creditorSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const before = await prisma.creditor.findUnique({ where: { id } });
    if (!before) return { error: "Creditor not found." };

    await prisma.creditor.update({ where: { id }, data: parsed.data });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Creditor",
      entityId: id,
      before: {
        name: before.name,
        type: before.type,
        phone: before.phone,
        email: before.email,
        preferredChannel: before.preferredChannel,
        isActive: before.isActive,
      },
      after: parsed.data,
    });

    revalidatePath(`/creditors/${id}`);
    revalidatePath("/creditors");
    redirect(`/creditors/${id}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[updateCreditorAction]", err);
    return { error: "Failed to update creditor. Please try again." };
  }
}
