import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DebtAccountForm } from "@/components/debt-accounts/DebtAccountForm";

export const metadata = { title: "Add Debt Account — DZC DMS" };

export default async function NewDebtAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id: clientId } = await params;

  const [client, creditors] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.creditor.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-xs text-muted-foreground mb-1">
          <Link href="/clients" className="hover:underline">
            Clients
          </Link>{" "}
          /{" "}
          <Link href={`/clients/${clientId}`} className="hover:underline">
            {client.firstName} {client.lastName}
          </Link>{" "}
          /
        </nav>
        <h1 className="text-2xl font-semibold">Add Debt Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enroll a new account for {client.firstName} {client.lastName}.
        </p>
      </div>
      <DebtAccountForm
        account={{ clientId }}
        creditors={creditors}
      />
    </div>
  );
}
