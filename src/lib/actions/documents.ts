"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import type { DocumentCategory } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";

const VALID_CATEGORIES = new Set<string>([
  "INTAKE",
  "STATEMENT",
  "HARDSHIP",
  "SETTLEMENT_AGREEMENT",
  "PROOF_OF_PAYMENT",
  "OTHER",
]);

export type DocumentActionResult = { error: string } | { success: true };

export type SaveDocumentData = {
  blobUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  category: string;
  notes: string | null;
  clientId: string | null;
  debtAccountId: string | null;
};

export async function saveDocumentAction(
  data: SaveDocumentData
): Promise<DocumentActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const { blobUrl, filename, mimeType, size, notes, clientId, debtAccountId } =
    data;

  if (!clientId && !debtAccountId) {
    return { error: "Document must be linked to a client or debt account." };
  }

  const category: DocumentCategory = VALID_CATEGORIES.has(data.category)
    ? (data.category as DocumentCategory)
    : "OTHER";

  const docId = crypto.randomUUID();

  try {
    await prisma.document.create({
      data: {
        id: docId,
        filename,
        mimeType,
        size,
        storagePath: blobUrl,
        category,
        notes: notes || null,
        clientId,
        debtAccountId,
        uploadedById: session.user.id,
      },
    });
  } catch {
    return { error: "Failed to save document record." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Document",
    entityId: docId,
    after: { filename, mimeType, category, clientId, debtAccountId },
  });

  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (debtAccountId) revalidatePath(`/accounts/${debtAccountId}`);

  return { success: true };
}

export async function deleteDocumentAction(
  id: string
): Promise<DocumentActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return { error: "Document not found." };

  await prisma.document.delete({ where: { id } });

  await writeAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Document",
    entityId: id,
    before: {
      filename: doc.filename,
      category: doc.category,
      clientId: doc.clientId,
      debtAccountId: doc.debtAccountId,
    },
  });

  // Best-effort blob deletion — don't fail if already gone
  await del(doc.storagePath).catch(() => null);

  if (doc.clientId) revalidatePath(`/clients/${doc.clientId}`);
  if (doc.debtAccountId) revalidatePath(`/accounts/${doc.debtAccountId}`);

  return { success: true };
}
