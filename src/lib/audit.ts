import { prisma } from "@/lib/db/prisma";

/**
 * Writes a row to the audit_logs table.
 *
 * Rules:
 * - Never pass raw passwords or secrets in `before`/`after`.
 * - Decimal fields should be coerced to strings before passing so that JSON
 *   serialisation is lossless (Prisma returns Decimal objects, not numbers).
 */
export async function writeAuditLog({
  userId,
  action,
  entityType,
  entityId,
  before,
  after,
}: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: object;
  after?: object;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      changes:
        before || after ? { before: before ?? null, after: after ?? null } : undefined,
      userId,
    },
  });
}
