import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo los administradores pueden editar usuarios" }, { status: 403 });
  }

  const { studioId } = session.user;
  const { id } = await params;
  const body = await req.json();

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({ where: { id, studioId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { password, ...rest } = parsed.data;
  const updated = await prisma.user.update({
    where: { id, studioId },
    data: {
      ...rest,
      ...(password && { password: await bcrypt.hash(password, 10) }),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo los administradores pueden eliminar usuarios" }, { status: 403 });
  }

  const { studioId, id: currentUserId } = session.user;
  const { id } = await params;

  if (id === currentUserId) {
    return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({ where: { id, studioId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.user.delete({ where: { id, studioId } });
  return NextResponse.json({ ok: true });
}