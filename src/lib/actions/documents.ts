"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import type { DocumentCategory } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";

// ─── Config ───────────────────────────────────────────────────────────────────

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const VALID_CATEGORIES = new Set<string>([
  "INTAKE",
  "STATEMENT",
  "HARDSHIP",
  "SETTLEMENT_AGREEMENT",
  "PROOF_OF_PAYMENT",
  "OTHER",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 200);
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export type DocumentActionResult =
  | { error: string }
  | { success: true };

export async function uploadDocumentAction(
  formData: FormData
): Promise<DocumentActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided." };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { error: "File exceeds the 10 MB limit." };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: "File type not allowed. Upload a PDF, image, Word doc, or plain text file." };
  }

  const clientId = (formData.get("clientId") as string) || null;
  const debtAccountId = (formData.get("debtAccountId") as string) || null;
  const categoryRaw = (formData.get("category") as string) || "OTHER";
  const notes = (formData.get("notes") as string) || null;

  if (!clientId && !debtAccountId) {
    return { error: "Document must be linked to a client or debt account." };
  }

  const category: DocumentCategory = VALID_CATEGORIES.has(categoryRaw)
    ? (categoryRaw as DocumentCategory)
    : "OTHER";

  // Build storage path: uploads/{clientId|accounts/accountId}/{docId}-{safeFilename}
  const docId = crypto.randomUUID();
  const safeFilename = sanitizeFilename(file.name);
  const subDir = clientId
    ? path.join(UPLOAD_DIR, clientId)
    : path.join(UPLOAD_DIR, "accounts", debtAccountId!);

  if (!existsSync(subDir)) {
    await mkdir(subDir, { recursive: true });
  }

  const diskFilename = `${docId}-${safeFilename}`;
  const absolutePath = path.join(subDir, diskFilename);

  // storagePath is relative to UPLOAD_DIR — portable across deploys
  const storagePath = clientId
    ? path.join(clientId, diskFilename)
    : path.join("accounts", debtAccountId!, diskFilename);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);
  } catch {
    return { error: "Failed to write file to disk." };
  }

  try {
    await prisma.document.create({
      data: {
        id: docId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        storagePath,
        category,
        notes: notes || null,
        clientId,
        debtAccountId,
        uploadedById: session.user.id,
      },
    });
  } catch {
    // Roll back the file write if the DB insert fails
    await unlink(absolutePath).catch(() => null);
    return { error: "Failed to save document record." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Document",
    entityId: docId,
    after: { filename: file.name, mimeType: file.type, category, clientId, debtAccountId },
  });

  if (clientId) {
    revalidatePath(`/clients/${clientId}`);
  }
  if (debtAccountId) {
    revalidatePath(`/accounts/${debtAccountId}`);
  }

  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

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

  // Best-effort file removal — don't fail the action if file is already gone
  const absolutePath = path.join(UPLOAD_DIR, doc.storagePath);
  await unlink(absolutePath).catch(() => null);

  if (doc.clientId) revalidatePath(`/clients/${doc.clientId}`);
  if (doc.debtAccountId) revalidatePath(`/accounts/${doc.debtAccountId}`);

  return { success: true };
}
