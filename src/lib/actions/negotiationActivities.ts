"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { activitySchema, CONTACT_TYPES } from "@/lib/validators/negotiationActivity";

export type ActivityActionResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

// Labels used when auto-generating follow-up task titles
const FOLLOW_UP_TITLE: Record<string, string> = {
  CALL: "Follow-up call",
  VOICEMAIL: "Return voicemail",
  EMAIL: "Follow-up email",
  LETTER: "Follow-up on mailed letter",
  INTERNAL_NOTE: "Follow-up",
  CLIENT_UPDATE: "Send client update",
  SETTLEMENT_DISCUSSION: "Continue settlement discussion",
  STATUS_CHANGE: "Follow-up",
  OFFER_SENT: "Follow up on offer",
  OFFER_RECEIVED: "Respond to offer",
};

export async function createActivityAction(
  formData: FormData
): Promise<ActivityActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    debtAccountId: formData.get("debtAccountId"),
    type: formData.get("type"),
    notes: formData.get("notes"),
    occurredAt: formData.get("occurredAt"),
    nextActionDate: formData.get("nextActionDate"),
    createFollowUpTask: formData.get("createFollowUpTask"),
    accountClientId: formData.get("accountClientId"),
  };

  const parsed = activitySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    debtAccountId,
    type,
    notes,
    occurredAt,
    nextActionDate,
    createFollowUpTask,
    accountClientId,
  } = parsed.data;

  try {
    // 1. Create the activity
    const activity = await prisma.negotiationActivity.create({
      data: {
        type,
        notes,
        occurredAt,
        nextActionDate: nextActionDate ?? null,
        debtAccountId,
        authorId: session.user.id,
      },
    });

    // 2. Update the account: nextFollowUpDate and (if a contact type) lastContactDate
    const accountUpdates: Record<string, Date> = {};
    if (nextActionDate) {
      accountUpdates.nextFollowUpDate = nextActionDate;
    }
    if (CONTACT_TYPES.has(type)) {
      accountUpdates.lastContactDate = occurredAt;
    }
    if (Object.keys(accountUpdates).length > 0) {
      await prisma.debtAccount.update({
        where: { id: debtAccountId },
        data: accountUpdates,
      });
    }

    // 3. Optionally auto-create a follow-up task
    if (createFollowUpTask && nextActionDate) {
      await prisma.task.create({
        data: {
          title: FOLLOW_UP_TITLE[type] ?? "Follow-up",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: nextActionDate,
          debtAccountId,
          clientId: accountClientId ?? null,
          createdById: session.user.id,
          assignedToId: session.user.id,
        },
      });
    }

    // 4. Audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "NegotiationActivity",
        entityId: activity.id,
        changes: {
          after: {
            type,
            occurredAt,
            nextActionDate: nextActionDate ?? null,
            debtAccountId,
          },
        },
        userId: session.user.id,
      },
    });

    revalidatePath(`/accounts/${debtAccountId}`);
  } catch (err) {
    console.error("[createActivityAction]", err);
    return { error: "Failed to save activity. Please try again." };
  }
}
