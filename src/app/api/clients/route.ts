import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createClientSchema, clientQuerySchema } from "@/lib/validations/client";
import { generateFiscalExpirations } from "@/lib/fiscal-calendar";

// ─── POST /api/clients ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { studioId } = session.user;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const existing = await prisma.client.findUnique({
    where: { studioId_cuit: { studioId, cuit: data.cuit } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un cliente con ese CUIT en el estudio" },
      { status: 409 }
    );
  }

  if (data.responsableId) {
    const responsable = await prisma.user.findFirst({
      where: { id: data.responsableId, studioId },
      select: { id: true },
    });
    if (!responsable) {
      return NextResponse.json(
        { error: "El responsable no existe en este estudio" },
        { status: 400 }
      );
    }
  }

  const client = await prisma.client.create({
    data: {
      studioId,
      razonSocial: data.razonSocial,
      cuit: data.cuit,
      tipoSocietario: data.tipoSocietario,
      condicionIva: data.condicionIva,
      actividadPrincipal: data.actividadPrincipal,
      inicioActividad: data.inicioActividad ? new Date(data.inicioActividad) : null,
      inscriptoIIBB: data.inscriptoIIBB,
      contactoNombre: data.contactoNombre,
      contactoEmail: data.contactoEmail,
      contactoTel: data.contactoTel,
      whatsapp: data.whatsapp,
      domicilio: data.domicilio,
      responsableId: data.responsableId,
      honorarios: data.honorarios,
      notas: data.notas,
      status: data.status,
    },
    include: { responsable: { select: { id: true, name: true } } },
  });

  // Auto-assign tax rules and generate fiscal expirations for current year
  if (client.condicionIva) {
    await generateFiscalExpirations(client.id, studioId, client.cuit);
  }

  return NextResponse.json(client, { status: 201 });
}

// ─── GET /api/clients ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { studioId } = session.user;
  const { searchParams } = new URL(req.url);

  const parsed = clientQuerySchema.safeParse({
    search: searchParams.get("search"),
    status: searchParams.get("status"),
    responsableId: searchParams.get("responsableId"),
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { search, status, responsableId, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = {
    studioId,
    ...(status && { status }),
    ...(responsableId && { responsableId }),
    ...(search && {
      OR: [
        { razonSocial: { contains: search, mode: "insensitive" as const } },
        { cuit: { contains: search } },
        { contactoNombre: { contains: search, mode: "insensitive" as const } },
        { contactoEmail: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { razonSocial: "asc" },
      include: {
        responsable: { select: { id: true, name: true } },
        _count: {
          select: {
            expirations: { where: { status: "PENDING" } },
            tasks: { where: { status: { in: ["TODO", "IN_PROGRESS"] } } },
          },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return NextResponse.json({
    data: clients,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
