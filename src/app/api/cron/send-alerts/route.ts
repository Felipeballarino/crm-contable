import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendExpirationAlert } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const studios = await prisma.studio.findMany({
    where: { alertEmail: { not: null } },
    select: { id: true, name: true, alertEmail: true, alertDaysBefore: true },
  });

  if (studios.length === 0) {
    return NextResponse.json({ message: "No hay estudios con email de alerta configurado." });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results: { studio: string; sent: number; skipped: string }[] = [];

  for (const studio of studios) {
    const limit = new Date(today);
    limit.setDate(limit.getDate() + studio.alertDaysBefore);

    const expirations = await prisma.expiration.findMany({
      where: {
        studioId: studio.id,
        status: "PENDING",
        alertSent: false,
        fechaVencimiento: { gte: today, lte: limit },
      },
      orderBy: { fechaVencimiento: "asc" },
      include: { client: { select: { razonSocial: true } } },
    });

    if (expirations.length === 0) {
      results.push({ studio: studio.name, sent: 0, skipped: "Sin vencimientos pendientes" });
      continue;
    }

    try {
      await sendExpirationAlert({
        to: studio.alertEmail!,
        studioName: studio.name,
        expirations,
      });

      await prisma.expiration.updateMany({
        where: { id: { in: expirations.map((e) => e.id) } },
        data: { alertSent: true },
      });

      results.push({ studio: studio.name, sent: expirations.length, skipped: "" });
    } catch (error) {
      results.push({
        studio: studio.name,
        sent: 0,
        skipped: error instanceof Error ? error.message : "Error al enviar",
      });
    }
  }

  const totalSent = results.reduce((sum, r) => sum + r.sent, 0);

  return NextResponse.json({
    message: `Alertas enviadas a ${studios.length} estudio(s)`,
    totalSent,
    results,
  });
}
