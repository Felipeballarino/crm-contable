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
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { month, year } = parsed.data;

  const templates = await prisma.recurringExpiration.findMany({
    where: { studioId, active: true },
  });

  if (templates.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0 });
  }

  let created = 0;
  let skipped = 0;

  for (const tpl of templates) {
    // Clamp day to last day of the month (ej: 31 en febrero → 28/29)
    const lastDay = new Date(year, month, 0).getDate();
    const day = Math.min(tpl.dayOfMonth, lastDay);
    const fechaVencimiento = new Date(year, month - 1, day);

    // Skip start of day to end of day range to check duplicates
    const startOfDay = new Date(year, month - 1, day);
    const endOfDay = new Date(year, month - 1, day + 1);

    const exists = await prisma.expiration.findFirst({
      where: {
        studioId,
        clientId: tpl.clientId,
        tipo: tpl.tipo,
        fechaVencimiento: { gte: startOfDay, lt: endOfDay },
      },
    });

    if (exists) {
      skipped++;
      continue;
    }

    await prisma.expiration.create({
      data: {
        studioId,
        clientId: tpl.clientId,
        tipo: tpl.tipo,
        descripcion: tpl.descripcion,
        fechaVencimiento,
      },
    });
    created++;
  }

  return NextResponse.json({ created, skipped });
}