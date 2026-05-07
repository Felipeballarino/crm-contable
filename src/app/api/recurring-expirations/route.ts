import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  clientId: z.string().min(1),
  tipo: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional(),
  dayOfMonth: z.number().int().min(1).max(31),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.recurringExpiration.findMany({
    where: { studioId: session.user.studioId, active: true },
    orderBy: [{ dayOfMonth: "asc" }, { tipo: "asc" }],
    include: { client: { select: { id: true, razonSocial: true } } },
  });

  return NextResponse.json(templates);
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

  const { clientId, tipo, descripcion, dayOfMonth } = parsed.data;

  const client = await prisma.client.findFirst({ where: { id: clientId, studioId } });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const template = await prisma.recurringExpiration.create({
    data: { clientId, studioId, tipo, descripcion, dayOfMonth },
    include: { client: { select: { id: true, razonSocial: true } } },
  });

  return NextResponse.json(template, { status: 201 });
}