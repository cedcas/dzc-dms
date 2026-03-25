"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { debtAccountSchema } from "@/lib/validators/debtAccount";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { writeAuditLog } from "@/lib/audit";

export type DebtAccountActionResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseFormData(formData: FormData) {
  return {
    clientId: formData.get("clientId"),
    accountNumber: formData.get("accountNumber"),
    originalBalance: formData.get("originalBalance"),
    currentBalance: formData.get("currentBalance"),
    settledAmount: formData.get("settledAmount"),
    status: formData.get("status"),
    delinquencyStage: formData.get("delinquencyStage"),
    openedAt: formData.get("openedAt"),
    chargedOffAt: formData.get("chargedOffAt"),
    settledAt: formData.get("settledAt"),
    lastContactDate: formData.get("lastContactDate"),
    nextFollowUpDate: formData.get("nextFollowUpDate"),
    creditorId: formData.get("creditorId"),
    originalCreditorName: formData.get("originalCreditorName"),
  };
}

export async function createDebtAccountAction(
  formData: FormData
): Promise<DebtAccountActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = debtAccountSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const account = await prisma.debtAccount.create({ data: parsed.data });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "DebtAccount",
      entityId: account.id,
      after: {
        clientId: parsed.data.clientId,
        status: parsed.data.status,
        originalBalance: parsed.data.originalBalance,
        currentBalance: parsed.data.currentBalance,
      },
    });

    revalidatePath(`/clients/${parsed.data.clientId}`);
    redirect(`/accounts/${account.id}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[createDebtAccountAction]", err);
    return { error: "Failed to create debt account. Please try again." };
  }
}

export async function updateDebtAccountAction(
  id: string,
  formData: FormData
): Promise<DebtAccountActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = debtAccountSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const before = await prisma.debtAccount.findUnique({ where: { id } });
    if (!before) return { error: "Debt account not found." };

    await prisma.debtAccount.update({ where: { id }, data: parsed.data });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "DebtAccount",
      entityId: id,
      before: {
        status: before.status,
        currentBalance: before.currentBalance?.toString(),
        delinquencyStage: before.delinquencyStage,
        lastContactDate: before.lastContactDate,
        nextFollowUpDate: before.nextFollowUpDate,
      },
      after: {
        status: parsed.data.status,
        currentBalance: parsed.data.currentBalance,
        delinquencyStage: parsed.data.delinquencyStage,
        lastContactDate: parsed.data.lastContactDate,
        nextFollowUpDate: parsed.data.nextFollowUpDate,
      },
    });

    revalidatePath(`/accounts/${id}`);
    revalidatePath(`/clients/${parsed.data.clientId}`);
    redirect(`/accounts/${id}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[updateDebtAccountAction]", err);
    return { error: "Failed to update debt account. Please try again." };
  }
}
