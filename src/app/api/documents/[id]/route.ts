import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { id } = await params;

  const doc = await prisma.document.findFirst({ where: { id, studioId } });
  if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const filePath = path.join(process.cwd(), "storage", doc.storagePath);

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.name)}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado en el servidor." }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { id } = await params;

  const doc = await prisma.document.findFirst({ where: { id, studioId } });
  if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Delete file from disk (ignore error if already gone)
  try {
    await unlink(path.join(process.cwd(), "storage", doc.storagePath));
  } catch {}

  await prisma.document.delete({ where: { id, studioId } });
  return NextResponse.json({ ok: true });
}
