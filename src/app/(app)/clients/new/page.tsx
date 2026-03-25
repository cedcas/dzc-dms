import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { ClientForm } from "@/components/clients/ClientForm";

export const metadata = { title: "New Client — DZC DMS" };

export default async function NewClientPage() {
  await requireAuth();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Client</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add a new client to the debt management program.
        </p>
      </div>
      <ClientForm users={users} />
    </div>
  );
}
