import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTaxRulesForClient, generateFiscalExpirations } from "@/lib/fiscal-calendar";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, studioId },
    select: { id: true, condicionIva: true, cuit: true },
  });

  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const [availableRules, assignments] = await Promise.all([
    getTaxRulesForClient(client.condicionIva),
    prisma.clientTaxAssignment.findMany({
      where: { studioId, clientId },
      include: { taxRule: true },
      orderBy: { taxRule: { nombre: "asc" } },
    }),
  ]);

  return NextResponse.json({
    client: { id: client.id, condicionIva: client.condicionIva, cuit: client.cuit },
    availableRules,
    assignments,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { clientId } = await params;
  const body = await req.json();

  const { taxRuleId, activo } = body as { taxRuleId: string; activo: boolean };

  if (!taxRuleId) {
    return NextResponse.json({ error: "taxRuleId requerido" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, studioId },
    select: { id: true, condicionIva: true, cuit: true },
  });

  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const assignment = await prisma.clientTaxAssignment.findFirst({
    where: { studioId, clientId, taxRuleId },
  });

  if (assignment) {
    await prisma.clientTaxAssignment.update({
      where: { id: assignment.id },
      data: { activo },
    });
  } else {
    await prisma.clientTaxAssignment.create({
      data: { studioId, clientId, taxRuleId, activo: true },
    });
  }

  return NextResponse.json({ ok: true });
}
