import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["PENDING", "DONE", "OVERDUE"]).optional(),
  tipo: z.string().min(1).max(100).optional(),
  descripcion: z.string().max(500).optional(),
  fechaVencimiento: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { id } = await params;
  const body = await req.json();

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.expiration.findFirst({ where: { id, studioId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { fechaVencimiento, ...rest } = parsed.data;
  const updated = await prisma.expiration.update({
    where: { id, studioId },
    data: {
      ...rest,
      ...(fechaVencimiento && { fechaVencimiento: new Date(fechaVencimiento) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { id } = await params;

  const existing = await prisma.expiration.findFirst({ where: { id, studioId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.expiration.delete({ where: { id, studioId } });
  return NextResponse.json({ ok: true });
}