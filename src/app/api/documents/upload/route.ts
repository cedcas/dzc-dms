import { put } from "@vercel/blob";
import { auth } from "@/auth";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return Response.json({ error: "File type not allowed" }, { status: 400 });
  }

  try {
    const blob = await put(file.name, file, {
      access: "private",
      contentType: file.type,
    });
    return Response.json({ url: blob.url });
  } catch (error) {
    console.error("[upload] put() failed:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
