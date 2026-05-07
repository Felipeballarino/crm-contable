import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { month, year } = parsed.data;

  // Only clients with honorarios set
  const clients = await prisma.client.findMany({
    where: { studioId, status: "ACTIVE", honorarios: { not: null } },
    select: { id: true, honorarios: true },
  });

  if (clients.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0, message: "No hay clientes activos con honorarios configurados." });
  }

  let created = 0;
  let skipped = 0;

  for (const client of clients) {
    try {
      await prisma.payment.create({
        data: {
          studioId,
          clientId: client.id,
          month,
          year,
          amount: client.honorarios!,
        },
      });
      created++;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
        skipped++;
      } else {
        throw error;
      }
    }
  }

  return NextResponse.json({ created, skipped });
}
