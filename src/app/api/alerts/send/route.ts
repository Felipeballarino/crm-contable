import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendExpirationAlert } from "@/lib/email";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;

  const studio = await prisma.studio.findUnique({ where: { id: studioId } });
  if (!studio) return NextResponse.json({ error: "Studio no encontrado" }, { status: 404 });

  if (!studio.alertEmail) {
    return NextResponse.json(
      { error: "Configurá un email de destino en Configuración antes de enviar alertas." },
      { status: 400 }
    );
  }

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

  if (expirations.length === 0) {
    return NextResponse.json({ sent: false, message: "No hay vencimientos próximos sin alerta enviada." });
  }

  try {
    await sendExpirationAlert({
      to: studio.alertEmail,
      studioName: studio.name,
      expirations,
    });
  } catch {
    return NextResponse.json({ error: "Error al enviar el email. Verificá la API key de Resend." }, { status: 500 });
  }

  await prisma.expiration.updateMany({
    where: { id: { in: expirations.map((e) => e.id) } },
    data: { alertSent: true },
  });

  return NextResponse.json({ sent: true, count: expirations.length });
}
