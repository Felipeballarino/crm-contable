import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["PENDING", "PAID"]),
  notas: z.string().max(500).optional(),
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.payment.findFirst({ where: { id, studioId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.payment.update({
    where: { id, studioId },
    data: {
      status: parsed.data.status,
      notas: parsed.data.notas,
      paidAt: parsed.data.status === "PAID" ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}
