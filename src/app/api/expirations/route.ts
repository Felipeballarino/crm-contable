import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  clientId: z.string().min(1),
  tipo: z.string().min(1, "El tipo es requerido").max(100),
  descripcion: z.string().max(500).optional(),
  fechaVencimiento: z.string().min(1, "La fecha es requerida"),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as "PENDING" | "DONE" | "OVERDUE" | null;
  const clientId = searchParams.get("clientId");

  const expirations = await prisma.expiration.findMany({
    where: {
      studioId,
      ...(status && { status }),
      ...(clientId && { clientId }),
    },
    orderBy: { fechaVencimiento: "asc" },
    include: {
      client: { select: { id: true, razonSocial: true } },
    },
  });

  return NextResponse.json(expirations);
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

  const { clientId, tipo, descripcion, fechaVencimiento } = parsed.data;

  const client = await prisma.client.findFirst({ where: { id: clientId, studioId } });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const expiration = await prisma.expiration.create({
    data: {
      clientId,
      studioId,
      tipo,
      descripcion,
      fechaVencimiento: new Date(fechaVencimiento),
    },
    include: { client: { select: { id: true, razonSocial: true } } },
  });

  return NextResponse.json(expiration, { status: 201 });
}