import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateClientSchema } from "@/lib/validations/client";

// ─── GET /api/clients/[id] ────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { studioId } = session.user;

  const client = await prisma.client.findFirst({
    where: { id, studioId },
    include: {
      responsable: { select: { id: true, name: true } },
      expirations: {
        orderBy: { fechaVencimiento: "asc" },
        select: {
          id: true,
          tipo: true,
          descripcion: true,
          fechaVencimiento: true,
          status: true,
          alertSent: true,
        },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { assignedTo: { select: { id: true, name: true } } },
      },
      interactions: {
        orderBy: { date: "desc" },
        take: 20,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  return NextResponse.json(client);
}

// ─── PATCH /api/clients/[id] ──────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { studioId } = session.user;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const existing = await prisma.client.findFirst({
    where: { id, studioId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const data = parsed.data;
  const updated = await prisma.client.update({
    where: { id, studioId },
    data: {
      ...data,
      inicioActividad: data.inicioActividad ? new Date(data.inicioActividad) : undefined,
    },
    include: { responsable: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}
