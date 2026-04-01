import { requireAdmin } from "@/lib/auth/guards";
import { UserForm } from "@/components/users/UserForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PAGE_TITLE } from "@/lib/ui-classes";

export const metadata = { title: "New User — DZC DMS" };

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="h-3 w-3" /> User Administration
        </Link>
        <h1 className={PAGE_TITLE}>New User</h1>
      </div>
      <UserForm />
    </div>
  );
}
