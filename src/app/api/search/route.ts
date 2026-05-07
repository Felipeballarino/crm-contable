import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json({ clients: [], expirations: [], tasks: [] });

  const [clients, expirations, tasks] = await Promise.all([
    prisma.client.findMany({
      where: {
        studioId,
        OR: [
          { razonSocial: { contains: q, mode: "insensitive" } },
          { cuit: { contains: q } },
          { contactoEmail: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, razonSocial: true, cuit: true, status: true },
      take: 5,
    }),
    prisma.expiration.findMany({
      where: {
        studioId,
        OR: [
          { tipo: { contains: q, mode: "insensitive" } },
          { descripcion: { contains: q, mode: "insensitive" } },
          { client: { razonSocial: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true, tipo: true, fechaVencimiento: true, status: true,
        client: { select: { id: true, razonSocial: true } },
      },
      orderBy: { fechaVencimiento: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        studioId,
        OR: [
          { titulo: { contains: q, mode: "insensitive" } },
          { descripcion: { contains: q, mode: "insensitive" } },
          { client: { razonSocial: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true, titulo: true, status: true, prioridad: true,
        client: { select: { id: true, razonSocial: true } },
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({ clients, expirations, tasks });
}
