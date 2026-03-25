import { requireAuth } from "@/lib/auth/guards";
import { CreditorForm } from "@/components/creditors/CreditorForm";

export const metadata = { title: "New Creditor — DZC DMS" };

export default async function NewCreditorPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Creditor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add a creditor or collector record to the system.
        </p>
      </div>
      <CreditorForm />
    </div>
  );
}
