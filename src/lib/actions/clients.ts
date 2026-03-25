"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clientSchema } from "@/lib/validators/client";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type ClientActionResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

async function writeAuditLog({
  userId,
  action,
  entityId,
  before,
  after,
}: {
  userId: string;
  action: string;
  entityId: string;
  before?: object;
  after?: object;
}) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType: "Client",
      entityId,
      changes:
        before || after ? { before: before ?? null, after: after ?? null } : undefined,
      userId,
    },
  });
}

function parseFormData(formData: FormData) {
  return {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    status: formData.get("status"),
    programStartDate: formData.get("programStartDate"),
    notes: formData.get("notes"),
    handlerId: formData.get("handlerId"),
  };
}

export async function createClientAction(
  formData: FormData
): Promise<ClientActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = clientSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const client = await prisma.client.create({ data: parsed.data });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityId: client.id,
      after: parsed.data,
    });

    revalidatePath("/clients");
    redirect(`/clients/${client.id}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[createClientAction]", err);
    return { error: "Failed to create client. Please try again." };
  }
}

export async function updateClientAction(
  id: string,
  formData: FormData
): Promise<ClientActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = clientSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const before = await prisma.client.findUnique({ where: { id } });
    if (!before) return { error: "Client not found." };

    await prisma.client.update({ where: { id }, data: parsed.data });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityId: id,
      before: {
        firstName: before.firstName,
        lastName: before.lastName,
        email: before.email,
        phone: before.phone,
        status: before.status,
        handlerId: before.handlerId,
      },
      after: parsed.data,
    });

    revalidatePath(`/clients/${id}`);
    revalidatePath("/clients");
    redirect(`/clients/${id}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[updateClientAction]", err);
    return { error: "Failed to update client. Please try again." };
  }
}
