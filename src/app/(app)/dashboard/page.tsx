import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ExpirationBadge } from "@/components/ui/expiration-badge";
import { SendAlertsButton } from "./send-alerts-button";
import { runAutomation } from "@/lib/automation";
import { AnalyticsSection } from "./analytics-section";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { studioId } = session.user;
  await runAutomation(studioId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { alertDaysBefore: true, alertEmail: true },
  });
  const alertLimit = new Date(today);
  alertLimit.setDate(alertLimit.getDate() + (studio?.alertDaysBefore ?? 5));

  const [activeClients, expirationsToday, pendingTasks, overdueExpirations, expirationsSoon, alertPending] =
    await Promise.all([
      prisma.client.count({ where: { studioId, status: "ACTIVE" } }),
      prisma.expiration.count({
        where: { studioId, status: "PENDING", fechaVencimiento: { gte: today, lt: tomorrow } },
      }),
      prisma.task.count({ where: { studioId, status: { in: ["TODO", "IN_PROGRESS"] } } }),
      prisma.expiration.count({ where: { studioId, status: "OVERDUE" } }),
      prisma.expiration.findMany({
        where: { studioId, status: "PENDING", fechaVencimiento: { gte: today, lte: next7Days } },
        orderBy: { fechaVencimiento: "asc" },
        take: 8,
        include: { client: { select: { id: true, razonSocial: true } } },
      }),
      prisma.expiration.count({
        where: { studioId, status: "PENDING", alertSent: false, fechaVencimiento: { gte: today, lte: alertLimit } },
      }),
    ]);

  const metrics = [
    { label: "Clientes activos", value: activeClients, color: "text-indigo-600" },
    { label: "Vencimientos hoy", value: expirationsToday, color: "text-red-600" },
    { label: "Vencimientos vencidos", value: overdueExpirations, color: "text-orange-600" },
    { label: "Tareas pendientes", value: pendingTasks, color: "text-blue-600" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Bienvenido, {session.user.name}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Analytics */}
      <AnalyticsSection />

      {/* Próximos vencimientos */}
      {expirationsSoon.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-10 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-900">Próximos vencimientos (7 días)</h2>
            <Link href="/clients" className="text-xs text-indigo-600 hover:underline">
              Ver clientes
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {expirationsSoon.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <Link
                    href={`/clients/${exp.client.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {exp.client.razonSocial}
                  </Link>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {exp.tipo}
                    {exp.descripcion ? ` — ${exp.descripcion}` : ""}
                  </div>
                </div>
                <ExpirationBadge date={exp.fechaVencimiento} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-10 p-10 text-center">
          <p className="text-sm text-slate-400">No hay vencimientos en los próximos 7 días</p>
        </div>
      )}

      <SendAlertsButton pendingCount={alertPending} />
    </div>
  );
}
