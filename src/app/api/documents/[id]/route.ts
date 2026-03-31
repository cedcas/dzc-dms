import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

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

  redirect(doc.storagePath);
}
