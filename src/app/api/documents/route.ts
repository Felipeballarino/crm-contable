import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const documents = await prisma.document.findMany({
    where: {
      studioId,
      ...(clientId && { clientId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      client: { select: { id: true, razonSocial: true } },
    },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId, id: uploadedById } = session.user;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const clientId = formData.get("clientId") as string | null;

  if (!file || !clientId) {
    return NextResponse.json({ error: "Archivo y cliente son requeridos." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Solo se aceptan PDF, Word, Excel, imágenes, texto y CSV." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo no puede superar 10 MB." }, { status: 400 });
  }

  const client = await prisma.client.findFirst({ where: { id: clientId, studioId } });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const dir = path.join(process.cwd(), "storage", studioId, clientId);

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
  } catch {
    return NextResponse.json({ error: "Error al guardar el archivo en el servidor." }, { status: 500 });
  }

  const storagePath = path.join(studioId, clientId, filename);

  const document = await prisma.document.create({
    data: {
      clientId,
      studioId,
      uploadedById,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      storagePath,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(document, { status: 201 });
}
