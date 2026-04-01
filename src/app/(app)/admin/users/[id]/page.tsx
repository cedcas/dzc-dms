import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { UserForm } from "@/components/users/UserForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PAGE_TITLE, PAGE_SUBTITLE } from "@/lib/ui-classes";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  return { title: user ? `Edit ${user.name} — DZC DMS` : "Edit User — DZC DMS" };
}

export default async function EditUserPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="h-3 w-3" /> User Administration
        </Link>
        <h1 className={PAGE_TITLE}>Edit User</h1>
        <p className={PAGE_SUBTITLE}>{user.name} · {user.email}</p>
      </div>
      <UserForm user={user} />
    </div>
  );
}
