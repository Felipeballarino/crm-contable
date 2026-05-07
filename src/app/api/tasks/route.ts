import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  clientId: z.string().min(1),
  titulo: z.string().min(1, "El título es requerido").max(200),
  descripcion: z.string().max(2000).optional(),
  prioridad: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as "TODO" | "IN_PROGRESS" | "DONE" | null;
  const clientId = searchParams.get("clientId");
  const assignedToId = searchParams.get("assignedToId");

  const tasks = await prisma.task.findMany({
    where: {
      studioId,
      ...(status && { status }),
      ...(clientId && { clientId }),
      ...(assignedToId && { assignedToId }),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      client: { select: { id: true, razonSocial: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId, titulo, descripcion, prioridad, dueDate, assignedToId } = parsed.data;

  const client = await prisma.client.findFirst({ where: { id: clientId, studioId } });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  if (assignedToId) {
    const assignee = await prisma.user.findFirst({ where: { id: assignedToId, studioId } });
    if (!assignee) return NextResponse.json({ error: "Usuario no encontrado en tu estudio" }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: {
      clientId,
      studioId,
      titulo,
      descripcion,
      prioridad,
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(assignedToId && { assignedToId }),
    },
    include: {
      client: { select: { id: true, razonSocial: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}