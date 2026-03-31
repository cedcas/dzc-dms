import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return new Response("Not found", { status: 404 });
  }

  const blobRes = await fetch(doc.storagePath, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!blobRes.ok) {
    return new Response("File not found", { status: 404 });
  }

  const encoded = encodeURIComponent(doc.filename);
  return new Response(blobRes.body, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encoded}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
