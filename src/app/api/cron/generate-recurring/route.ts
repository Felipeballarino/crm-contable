import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const studios = await prisma.studio.findMany({
    select: { id: true, name: true },
  });

  if (studios.length === 0) {
    return NextResponse.json({ message: "No hay estudios." });
  }

  const results: { studio: string; created: number; skipped: number }[] = [];

  for (const studio of studios) {
    const templates = await prisma.recurringExpiration.findMany({
      where: { studioId: studio.id, active: true },
    });

    if (templates.length === 0) {
      results.push({ studio: studio.name, created: 0, skipped: 0 });
      continue;
    }

    let created = 0;
    let skipped = 0;

    for (const tpl of templates) {
      const lastDay = new Date(year, month, 0).getDate();
      const day = Math.min(tpl.dayOfMonth, lastDay);
      const fechaVencimiento = new Date(year, month - 1, day);

      const startOfDay = new Date(year, month - 1, day);
      const endOfDay = new Date(year, month - 1, day + 1);

      const exists = await prisma.expiration.findFirst({
        where: {
          studioId: studio.id,
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
          studioId: studio.id,
          clientId: tpl.clientId,
          tipo: tpl.tipo,
          descripcion: tpl.descripcion,
          fechaVencimiento,
        },
      });
      created++;
    }

    results.push({ studio: studio.name, created, skipped });
  }

  const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);

  return NextResponse.json({
    message: `Vencimientos generados para ${month}/${year}`,
    totalCreated,
    totalSkipped,
    results,
  });
}
