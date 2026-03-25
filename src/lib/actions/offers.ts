"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { offerSchema } from "@/lib/validators/offer";

export type OfferActionResult =
  | { error: string; fieldErrors?: Record<string, string[]>; conflictAccepted?: true }
  | undefined;

export async function createOfferAction(
  formData: FormData
): Promise<OfferActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    debtAccountId: formData.get("debtAccountId"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    percentOfBalance: formData.get("percentOfBalance"),
    source: formData.get("source"),
    paymentType: formData.get("paymentType"),
    installmentCount: formData.get("installmentCount"),
    installmentFreq: formData.get("installmentFreq"),
    status: formData.get("status"),
    expiresAt: formData.get("expiresAt"),
    notes: formData.get("notes"),
    replaceAccepted: formData.get("replaceAccepted"),
  };

  const parsed = offerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    debtAccountId,
    direction,
    amount,
    percentOfBalance,
    source,
    paymentType,
    installmentCount,
    installmentFreq,
    status,
    expiresAt,
    notes,
    replaceAccepted,
  } = parsed.data;

  try {
    // If this offer is being accepted, enforce single-accepted-offer rule
    if (status === "ACCEPTED") {
      const existingAccepted = await prisma.offer.findFirst({
        where: { debtAccountId, status: "ACCEPTED" },
        select: { id: true },
      });

      if (existingAccepted) {
        if (!replaceAccepted) {
          // Return a conflict signal — the client will show a confirmation prompt
          return {
            error:
              "There is already an accepted offer on this account. Check the box below to replace it.",
            conflictAccepted: true,
          };
        }
        // Supersede the old accepted offer
        await prisma.offer.update({
          where: { id: existingAccepted.id },
          data: { status: "COUNTERED", updatedAt: new Date() },
        });
      }
    }

    const offer = await prisma.offer.create({
      data: {
        debtAccountId,
        direction,
        amount,
        percentOfBalance: percentOfBalance ?? null,
        source: source ?? null,
        paymentType,
        installmentCount: installmentCount ?? null,
        installmentFreq: installmentFreq ?? null,
        status,
        expiresAt: expiresAt ?? null,
        respondedAt: status !== "PENDING" ? new Date() : null,
        notes: notes ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "Offer",
        entityId: offer.id,
        changes: {
          after: { direction, amount, status, paymentType, debtAccountId },
        },
        userId: session.user.id,
      },
    });

    revalidatePath(`/accounts/${debtAccountId}`);
  } catch (err) {
    console.error("[createOfferAction]", err);
    return { error: "Failed to save offer. Please try again." };
  }
}

export async function updateOfferStatusAction(
  offerId: string,
  newStatus: "ACCEPTED" | "REJECTED" | "COUNTERED" | "EXPIRED",
  replaceAccepted = false
): Promise<OfferActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: { id: true, debtAccountId: true, status: true },
    });
    if (!offer) return { error: "Offer not found." };

    if (newStatus === "ACCEPTED") {
      const existingAccepted = await prisma.offer.findFirst({
        where: {
          debtAccountId: offer.debtAccountId,
          status: "ACCEPTED",
          id: { not: offerId },
        },
        select: { id: true },
      });

      if (existingAccepted) {
        if (!replaceAccepted) {
          return {
            error:
              "There is already an accepted offer on this account. Confirm replacement to proceed.",
            conflictAccepted: true,
          };
        }
        await prisma.offer.update({
          where: { id: existingAccepted.id },
          data: { status: "COUNTERED", updatedAt: new Date() },
        });
      }
    }

    await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: newStatus,
        respondedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "Offer",
        entityId: offerId,
        changes: {
          before: { status: offer.status },
          after: { status: newStatus },
        },
        userId: session.user.id,
      },
    });

    revalidatePath(`/accounts/${offer.debtAccountId}`);
  } catch (err) {
    console.error("[updateOfferStatusAction]", err);
    return { error: "Failed to update offer. Please try again." };
  }
}
