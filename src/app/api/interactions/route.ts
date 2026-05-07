import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  clientId: z.string().min(1),
  tipo: z.enum(["CALL", "MEETING", "EMAIL", "NOTE"]),
  descripcion: z.string().min(1, "La descripción es requerida").max(2000),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const interactions = await prisma.interaction.findMany({
    where: {
      studioId,
      ...(clientId && { clientId }),
    },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
      client: { select: { id: true, razonSocial: true } },
    },
  });

  return NextResponse.json(interactions);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId, id: userId } = session.user;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId, tipo, descripcion, date } = parsed.data;

  const client = await prisma.client.findFirst({ where: { id: clientId, studioId } });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const interaction = await prisma.interaction.create({
    data: {
      clientId,
      studioId,
      userId,
      tipo,
      descripcion,
      ...(date && { date: new Date(date) }),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(interaction, { status: 201 });
}