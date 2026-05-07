"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, CalendarDays, Clock } from "lucide-react";

type RevenueMonth = { label: string; total: number; collected: number; pending: number; count: number };
type ExpirationWeek = { label: string; count: number };
type OverdueClient = { clientId: string; name: string; overdueCount: number; daysOverdue: number };

type Metrics = {
  activeClients: number;
  expirationsTodayCount: number;
  expirationsSoon: { id: string; tipo: string; descripcion: string | null; fechaVencimiento: string; client: { id: string; razonSocial: string } }[];
  pendingTasksCount: number;
  overdueExpirations: number;
  revenueData: RevenueMonth[];
  expirationsByWeek: ExpirationWeek[];
  overdueClients: OverdueClient[];
  oldPendingTotal: number;
  oldPendingCount: number;
};

function formatMoney(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function BarChart({ data, height = 120 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-xs text-slate-500 font-medium tabular-nums">
              {d.value > 0 ? d.value : "—"}
            </span>
            <div className="w-full bg-slate-100 rounded-t-sm relative overflow-hidden" style={{ height: height - 30 }}>
              <div
                className={`absolute bottom-0 w-full rounded-t-sm transition-all ${d.color ?? "bg-indigo-500"}`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StackedBarChart({ data, height = 120 }: { data: RevenueMonth[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const totalPct = (d.total / max) * 100;
        const collectedPct = d.total > 0 ? (d.collected / d.total) * 100 : 0;
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-xs text-slate-500 font-medium tabular-nums">
              {d.total > 0 ? formatMoney(d.total) : "—"}
            </span>
            <div className="w-full bg-slate-100 rounded-t-sm relative overflow-hidden" style={{ height: height - 30 }}>
              <div
                className="absolute bottom-0 w-full bg-green-400 transition-all"
                style={{ height: `${(totalPct * collectedPct) / 100}%` }}
              />
              {d.pending > 0 && (
                <div
                  className="absolute bottom-0 w-full bg-amber-300 transition-all"
                  style={{ height: `${(totalPct * (100 - collectedPct)) / 100}%`, bottom: `${(totalPct * collectedPct) / 100}%` }}
                />
              )}
            </div>
            <span className="text-xs text-slate-400 truncate w-full text-center">{d.label.split(" ")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsSection() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
            <div className="h-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const currentMonthRevenue = metrics.revenueData[metrics.revenueData.length - 1];
  const prevMonthRevenue = metrics.revenueData[metrics.revenueData.length - 2];
  const revenueChange =
    prevMonthRevenue.total > 0
      ? Math.round(((currentMonthRevenue.total - prevMonthRevenue.total) / prevMonthRevenue.total) * 100)
      : 0;

  const collectionRate =
    currentMonthRevenue.total > 0
      ? Math.round((currentMonthRevenue.collected / currentMonthRevenue.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Revenue summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Facturación este mes</p>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(currentMonthRevenue.total)}</p>
          <div className="flex items-center gap-1 mt-1">
            {revenueChange > 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            ) : revenueChange < 0 ? (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            ) : null}
            <span className={`text-xs font-medium ${revenueChange > 0 ? "text-green-600" : revenueChange < 0 ? "text-red-600" : "text-slate-400"}`}>
              {revenueChange > 0 ? "+" : ""}{revenueChange}% vs mes anterior
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Cobrado este mes</p>
          <p className="text-2xl font-bold text-green-600">{formatMoney(currentMonthRevenue.collected)}</p>
          <p className="text-xs text-slate-400 mt-1">{collectionRate}% cobrado</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Pendiente este mes</p>
          <p className="text-2xl font-bold text-amber-600">{formatMoney(currentMonthRevenue.pending)}</p>
          <p className="text-xs text-slate-400 mt-1">{currentMonthRevenue.count} clientes</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Deuda acumulada</p>
          <p className="text-2xl font-bold text-red-600">{formatMoney(metrics.oldPendingTotal)}</p>
          <p className="text-xs text-slate-400 mt-1">{metrics.oldPendingCount} cobros viejos</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-slate-900 text-sm">Facturación últimos 6 meses</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Cobrado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300" /> Pendiente</span>
            </div>
          </div>
          <StackedBarChart data={metrics.revenueData} />
        </div>

        {/* Expirations by week */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-slate-900 text-sm">Vencimientos próximas 4 semanas</h2>
            <CalendarDays className="h-4 w-4 text-slate-400" />
          </div>
          <BarChart
            data={metrics.expirationsByWeek.map((w) => ({
              label: `Sem. ${w.label}`,
              value: w.count,
              color: w.count > 5 ? "bg-red-400" : w.count > 2 ? "bg-amber-400" : "bg-indigo-400",
            }))}
          />
        </div>
      </div>

      {/* Overdue clients + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue clients */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Clientes con vencimientos vencidos
            </h2>
            <span className="text-xs text-slate-400">{metrics.overdueClients.length} clientes</span>
          </div>
          {metrics.overdueClients.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400">
              No hay vencimientos vencidos
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-2.5 font-medium text-slate-500">Cliente</th>
                  <th className="text-left px-6 py-2.5 font-medium text-slate-500">Vencimientos vencidos</th>
                  <th className="text-left px-6 py-2.5 font-medium text-slate-500">Antigüedad</th>
                  <th className="px-6 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics.overdueClients.map((c) => (
                  <tr key={c.clientId} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <Link href={`/clients/${c.clientId}`} className="font-medium text-slate-800 hover:text-indigo-600">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        {c.overdueCount}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {c.daysOverdue} días
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/clients/${c.clientId}`} className="text-xs text-indigo-600 hover:underline">
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-medium text-slate-900 mb-3">Resumen rápido</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Vencimientos hoy</span>
                <span className={`text-lg font-bold ${metrics.expirationsTodayCount > 0 ? "text-red-600" : "text-slate-300"}`}>
                  {metrics.expirationsTodayCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Vencimientos vencidos</span>
                <span className={`text-lg font-bold ${metrics.overdueExpirations > 0 ? "text-orange-600" : "text-slate-300"}`}>
                  {metrics.overdueExpirations}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Tareas pendientes</span>
                <span className="text-lg font-bold text-blue-600">{metrics.pendingTasksCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Clientes activos</span>
                <span className="text-lg font-bold text-indigo-600">{metrics.activeClients}</span>
              </div>
            </div>
          </div>

          {metrics.expirationsSoon.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-medium text-slate-900 mb-3">Próximos 7 días</h3>
              <div className="space-y-2">
                {metrics.expirationsSoon.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/clients/${exp.client.id}`} className="text-sm font-medium text-slate-800 hover:text-indigo-600 truncate block">
                        {exp.client.razonSocial}
                      </Link>
                      <p className="text-xs text-slate-400 truncate">{exp.tipo}</p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">
                      {new Date(exp.fechaVencimiento).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
