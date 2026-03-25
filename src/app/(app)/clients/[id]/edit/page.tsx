import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClientForm } from "@/components/clients/ClientForm";

export const metadata = { title: "Edit Client — DZC DMS" };

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const [client, users] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        programStartDate: true,
        notes: true,
        handlerId: true,
      },
    }),
    prisma.user.findMany({
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
          <Link href={`/clients/${id}`} className="hover:underline">
            {client.firstName} {client.lastName}
          </Link>{" "}
          /
        </nav>
        <h1 className="text-2xl font-semibold">
          Edit {client.firstName} {client.lastName}
        </h1>
      </div>
      <ClientForm client={client} users={users} />
    </div>
  );
}
