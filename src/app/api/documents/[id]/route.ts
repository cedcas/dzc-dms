import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

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

  const absolutePath = path.join(UPLOAD_DIR, doc.storagePath);

  let buffer: Buffer;
  try {
    buffer = await readFile(absolutePath);
  } catch {
    return new Response("File not found on disk", { status: 404 });
  }

  const encoded = encodeURIComponent(doc.filename);
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encoded}`,
      "Content-Length": String(buffer.length),
      // Prevent browsers from sniffing the MIME type
      "X-Content-Type-Options": "nosniff",
    },
  });
}
