import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DebtAccountForm } from "@/components/debt-accounts/DebtAccountForm";

export const metadata = { title: "Edit Debt Account — DZC DMS" };

export default async function EditDebtAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const [account, creditors] = await Promise.all([
    prisma.debtAccount.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        creditor: { select: { id: true, name: true } },
      },
    }),
    prisma.creditor.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!account) notFound();

  const creditorName =
    account.creditor?.name ?? account.originalCreditorName ?? "Account";

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-xs text-muted-foreground mb-1">
          <Link href="/clients" className="hover:underline">
            Clients
          </Link>{" "}
          /{" "}
          <Link
            href={`/clients/${account.client.id}`}
            className="hover:underline"
          >
            {account.client.firstName} {account.client.lastName}
          </Link>{" "}
          /{" "}
          <Link href={`/accounts/${id}`} className="hover:underline">
            {creditorName}
          </Link>{" "}
          /
        </nav>
        <h1 className="text-2xl font-semibold">Edit Debt Account</h1>
      </div>
      <DebtAccountForm
        account={{
          id: account.id,
          clientId: account.clientId,
          accountNumber: account.accountNumber,
          originalBalance: account.originalBalance,
          currentBalance: account.currentBalance,
          settledAmount: account.settledAmount,
          status: account.status,
          delinquencyStage: account.delinquencyStage,
          openedAt: account.openedAt,
          chargedOffAt: account.chargedOffAt,
          settledAt: account.settledAt,
          lastContactDate: account.lastContactDate,
          nextFollowUpDate: account.nextFollowUpDate,
          creditorId: account.creditorId,
          originalCreditorName: account.originalCreditorName,
        }}
        creditors={creditors}
      />
    </div>
  );
}
