"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadDocumentAction, deleteDocumentAction } from "@/lib/actions/documents";
import type { DocumentCategory } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentRow = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  notes: string | null;
  createdAt: Date;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  INTAKE: "Intake",
  STATEMENT: "Statement",
  HARDSHIP: "Hardship",
  SETTLEMENT_AGREEMENT: "Settlement Agreement",
  PROOF_OF_PAYMENT: "Proof of Payment",
  OTHER: "Misc",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Upload Form ─────────────────────────────────────────────────────────────

export function DocumentUploadForm({
  clientId,
  debtAccountId,
  documents,
}: {
  clientId?: string;
  debtAccountId?: string;
  documents: DocumentRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (clientId) formData.set("clientId", clientId);
    if (debtAccountId) formData.set("debtAccountId", debtAccountId);

    startTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setFormKey((k) => k + 1);
        router.refresh();
      }
    });
  }

  return (
    <div>
      {/* Upload form */}
      <div className="px-5 py-4 border-b bg-muted/20">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Upload Document
        </p>

        <form key={formKey} onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-3">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="doc-file">
                File <span className="text-destructive">*</span>
              </Label>
              <input
                id="doc-file"
                name="file"
                type="file"
                required
                ref={fileRef}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-input file:text-xs file:font-medium file:bg-background file:cursor-pointer cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PDF, image, Word doc, or plain text · max 10 MB
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-category">Category</Label>
              <select
                id="doc-category"
                name="category"
                defaultValue="OTHER"
                className={FIELD_CLASS}
              >
                {(Object.entries(CATEGORY_LABELS) as [DocumentCategory, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc-notes">Notes (optional)</Label>
            <input
              id="doc-notes"
              name="notes"
              type="text"
              placeholder="Brief description or context"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </form>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          No documents uploaded.
        </p>
      ) : (
        <ul className="divide-y">
          {documents.map((doc) => (
            <DocumentListItem key={doc.id} doc={doc} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── List Item ────────────────────────────────────────────────────────────────

function DocumentListItem({ doc }: { doc: DocumentRow }) {
  const router = useRouter();
  const [deleting, startDelete] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${doc.filename}"? This cannot be undone.`)) return;
    startDelete(async () => {
      await deleteDocumentAction(doc.id);
      router.refresh();
    });
  }

  return (
    <li className={`px-5 py-3 flex items-center gap-3 ${deleting ? "opacity-50" : ""}`}>
      <span className="shrink-0 text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">
        {CATEGORY_LABELS[doc.category] ?? doc.category}
      </span>

      <div className="flex-1 min-w-0">
        <a
          href={`/api/documents/${doc.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline underline-offset-2 truncate block"
        >
          {doc.filename}
        </a>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatBytes(doc.size)} · {formatDate(doc.createdAt)}
          {doc.notes && <span> · {doc.notes}</span>}
        </p>
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
        aria-label="Delete document"
      >
        Delete
      </button>
    </li>
  );
}
