import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CreditorForm } from "@/components/creditors/CreditorForm";

export const metadata = { title: "Edit Creditor — DZC DMS" };

export default async function EditCreditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const creditor = await prisma.creditor.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      phone: true,
      email: true,
      address: true,
      website: true,
      preferredChannel: true,
      notes: true,
      isActive: true,
    },
  });

  if (!creditor) notFound();

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-xs text-muted-foreground mb-1">
          <Link href="/creditors" className="hover:underline">
            Creditors
          </Link>{" "}
          /{" "}
          <Link href={`/creditors/${id}`} className="hover:underline">
            {creditor.name}
          </Link>{" "}
          /
        </nav>
        <h1 className="text-2xl font-semibold">Edit {creditor.name}</h1>
      </div>
      <CreditorForm creditor={creditor} />
    </div>
  );
}
