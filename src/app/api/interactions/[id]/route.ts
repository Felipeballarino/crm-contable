import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  tipo: z.enum(["CALL", "MEETING", "EMAIL", "NOTE"]).optional(),
  descripcion: z.string().min(1).max(2000).optional(),
  date: z.string().optional(),
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

  const existing = await prisma.interaction.findFirst({ where: { id, studioId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { date, ...rest } = parsed.data;
  const updated = await prisma.interaction.update({
    where: { id, studioId },
    data: {
      ...rest,
      ...(date && { date: new Date(date) }),
    },
    include: { user: { select: { id: true, name: true } } },
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

  const existing = await prisma.interaction.findFirst({ where: { id, studioId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.interaction.delete({ where: { id, studioId } });
  return NextResponse.json({ ok: true });
}
