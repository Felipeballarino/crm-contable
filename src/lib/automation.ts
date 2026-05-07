import { prisma } from "@/lib/prisma";
import { sendExpirationAlert } from "@/lib/email";
import { syncOverdue } from "./sync-overdue";

export async function runAutomation(studioId: string) {
  // 1. Mark overdue expirations
  await syncOverdue(studioId);

  // 2. Auto-send alerts for upcoming expirations
  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { alertEmail: true, alertDaysBefore: true, name: true },
  });

  if (studio?.alertEmail) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + studio.alertDaysBefore);

    const expirations = await prisma.expiration.findMany({
      where: {
        studioId,
        status: "PENDING",
        alertSent: false,
        fechaVencimiento: { gte: today, lte: limit },
      },
      orderBy: { fechaVencimiento: "asc" },
      include: { client: { select: { razonSocial: true } } },
    });

    if (expirations.length > 0) {
      try {
        await sendExpirationAlert({
          to: studio.alertEmail,
          studioName: studio.name,
          expirations,
        });

        await prisma.expiration.updateMany({
          where: { id: { in: expirations.map((e) => e.id) } },
          data: { alertSent: true },
        });
      } catch {
        // Silently fail — email service may be unavailable
      }
    }
  }

  // 3. Auto-generate recurring expirations for current month
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const templates = await prisma.recurringExpiration.findMany({
    where: { studioId, active: true },
  });

  if (templates.length > 0) {
    for (const tpl of templates) {
      const lastDay = new Date(year, month, 0).getDate();
      const day = Math.min(tpl.dayOfMonth, lastDay);
      const fechaVencimiento = new Date(year, month - 1, day);

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

      if (!exists) {
        await prisma.expiration.create({
          data: {
            studioId,
            clientId: tpl.clientId,
            tipo: tpl.tipo,
            descripcion: tpl.descripcion,
            fechaVencimiento,
          },
        });
      }
    }
  }
}
