import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { studioId } = session.user;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  const [activeClients, expirationsTodayCount, expirationsSoon, pendingTasksCount, overdueExpirations] =
    await Promise.all([
      prisma.client.count({ where: { studioId, status: "ACTIVE" } }),
      prisma.expiration.count({
        where: { studioId, status: "PENDING", fechaVencimiento: { gte: today, lt: tomorrow } },
      }),
      prisma.expiration.findMany({
        where: { studioId, status: "PENDING", fechaVencimiento: { gte: today, lte: next7Days } },
        orderBy: { fechaVencimiento: "asc" },
        take: 5,
        include: { client: { select: { id: true, razonSocial: true } } },
      }),
      prisma.task.count({ where: { studioId, status: { in: ["TODO", "IN_PROGRESS"] } } }),
      prisma.expiration.count({ where: { studioId, status: "OVERDUE" } }),
    ]);

  // ─── Revenue: last 6 months ──────────────────────────────────────────
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const revenueMonths: { month: number; year: number; label: string }[] = [];
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    while (m <= 0) { m += 12; y--; }
    revenueMonths.push({ month: m, year: y, label: `${monthNames[m - 1]} ${y}` });
  }

  const revenueData = await Promise.all(
    revenueMonths.map(async ({ month, year, label }) => {
      const payments = await prisma.payment.findMany({
        where: { studioId, month, year },
        select: { amount: true, status: true },
      });
      const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const collected = payments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const pending = total - collected;
      const count = payments.length;
      return { label, total, collected, pending, count };
    })
  );

  // ─── Expirations by week (next 4 weeks) ─────────────────────────────
  const weeks: { label: string; start: Date; end: Date }[] = [];
  for (let i = 0; i < 4; i++) {
    const start = new Date(today);
    start.setDate(start.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const label = `${start.getDate()}/${start.getMonth() + 1}`;
    weeks.push({ label, start, end });
  }

  const expirationsByWeek = await Promise.all(
    weeks.map(async ({ label, start, end }) => {
      const count = await prisma.expiration.count({
        where: {
          studioId,
          status: "PENDING",
          fechaVencimiento: { gte: start, lte: end },
        },
      });
      return { label, count };
    })
  );

  // ─── Overdue clients (morosidad) ─────────────────────────────────────
  const overdueClients = await prisma.expiration.groupBy({
    by: ["clientId"],
    where: { studioId, status: "OVERDUE" },
    _count: { id: true },
    _min: { fechaVencimiento: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const overdueClientDetails = await Promise.all(
    overdueClients.map(async ({ clientId, _count, _min }) => {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, razonSocial: true },
      });
      const daysOverdue = client
        ? Math.floor((today.getTime() - _min.fechaVencimiento!.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        clientId,
        name: client?.razonSocial ?? "Desconocido",
        overdueCount: _count.id,
        daysOverdue,
      };
    })
  );

  // ─── Pending payments older than current month ───────────────────────
  const oldPendingPayments = await prisma.payment.findMany({
    where: {
      studioId,
      status: "PENDING",
      OR: [
        { year: { lt: currentYear } },
        { year: currentYear, month: { lt: currentMonth } },
      ],
    },
    select: { amount: true, month: true, year: true, client: { select: { razonSocial: true } } },
  });

  const oldPendingTotal = oldPendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const oldPendingCount = oldPendingPayments.length;

  return NextResponse.json({
    activeClients,
    expirationsTodayCount,
    expirationsSoon,
    pendingTasksCount,
    overdueExpirations,
    revenueData,
    expirationsByWeek,
    overdueClients: overdueClientDetails,
    oldPendingTotal,
    oldPendingCount,
  });
}
