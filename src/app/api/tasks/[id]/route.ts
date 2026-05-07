import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  titulo: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(2000).optional(),
  prioridad: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
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

  const existing = await prisma.task.findFirst({ where: { id, studioId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (parsed.data.assignedToId) {
    const assignee = await prisma.user.findFirst({ where: { id: parsed.data.assignedToId, studioId } });
    if (!assignee) return NextResponse.json({ error: "Usuario no encontrado en tu estudio" }, { status: 404 });
  }

  const { dueDate, ...rest } = parsed.data;
  const updated = await prisma.task.update({
    where: { id, studioId },
    data: {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
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

  const existing = await prisma.task.findFirst({ where: { id, studioId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.task.delete({ where: { id, studioId } });
  return NextResponse.json({ ok: true });
}