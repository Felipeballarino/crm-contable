import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ExpirationRow } from "./expiration-row";
import { NewExpirationModal } from "./new-expiration-modal";
import { RecurringManager } from "./recurring-manager";
import { CalendarView } from "./calendar-view";
import { ExportButton } from "@/components/ui/export-button";
import { runAutomation } from "@/lib/automation";
import { FiscalCalendarView } from "./fiscal-calendar-view";

type StatusFilter = "PENDING" | "DONE" | "OVERDUE" | undefined;
type View = "list" | "calendar" | "recurring" | "fiscal";

const STATUS_TABS = [
  { label: "Pendientes", value: "PENDING" },
  { label: "Vencidos", value: "OVERDUE" },
  { label: "Hechos", value: "DONE" },
  { label: "Todos", value: "" },
] as const;

const VIEW_TABS = [
  { label: "Lista", value: "list" },
  { label: "Calendario", value: "calendar" },
  { label: "Plantillas", value: "recurring" },
  { label: "Calendario Fiscal", value: "fiscal" },
] as const;

export default async function VencimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; month?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { studioId } = session.user;
  await runAutomation(studioId);
  const params = await searchParams;
  const view = (params.view as View) ?? "list";
  const statusFilter = (params.status as StatusFilter) ?? "PENDING";

  const today = new Date();
  const calMonth = params.month ? parseInt(params.month) : today.getMonth() + 1;
  const calYear = params.year ? parseInt(params.year) : today.getFullYear();

  const [expirations, clients, templates, calendarExpirations] = await Promise.all([
    view !== "calendar"
      ? prisma.expiration.findMany({
          where: { studioId, ...(statusFilter && { status: statusFilter }) },
          orderBy: { fechaVencimiento: "asc" },
          include: { client: { select: { id: true, razonSocial: true } } },
        })
      : Promise.resolve([]),
    prisma.client.findMany({
      where: { studioId, status: "ACTIVE" },
      select: { id: true, razonSocial: true },
      orderBy: { razonSocial: "asc" },
    }),
    view === "recurring"
      ? prisma.recurringExpiration.findMany({
          where: { studioId, active: true },
          orderBy: [{ dayOfMonth: "asc" }, { tipo: "asc" }],
          include: { client: { select: { id: true, razonSocial: true } } },
        })
      : Promise.resolve([]),
    view === "calendar"
      ? prisma.expiration.findMany({
          where: {
            studioId,
            fechaVencimiento: {
              gte: new Date(calYear, calMonth - 1, 1),
              lt: new Date(calYear, calMonth, 1),
            },
          },
          orderBy: { fechaVencimiento: "asc" },
          include: { client: { select: { id: true, razonSocial: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Vencimientos</h1>
        <div className="flex items-center gap-2">
          <ExportButton href={`/api/export/vencimientos?month=${calMonth}&year=${calYear}`} label="Exportar Excel" />
          <NewExpirationModal clients={clients} />
        </div>
      </div>

      {/* Vista tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
        {VIEW_TABS.map(({ label, value }) => (
          <Link
            key={value}
            href={`/vencimientos?view=${value}`}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {view === "calendar" && (
        <CalendarView
          expirations={calendarExpirations}
          month={calMonth}
          year={calYear}
        />
      )}

      {view === "recurring" && (
        <RecurringManager templates={templates} clients={clients} />
      )}

      {view === "fiscal" && (
        <FiscalCalendarView />
      )}

      {view === "list" && (
        <>
          <div className="flex gap-1 mb-4 bg-slate-50 border border-slate-200 p-1 rounded-lg w-fit">
            {STATUS_TABS.map(({ label, value }) => {
              const active = (statusFilter ?? "") === value;
              return (
                <Link
                  key={value}
                  href={value ? `/vencimientos?status=${value}` : "/vencimientos"}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {expirations.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                No hay vencimientos en esta categoría
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-slate-500">Cliente</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-500">Tipo</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-500">Descripción</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-500">Fecha</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-500">Estado</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expirations.map((exp) => (
                    <ExpirationRow key={exp.id} exp={exp} />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {expirations.length > 0 && (
            <p className="mt-3 text-xs text-slate-400 text-right">
              {expirations.length} vencimiento{expirations.length !== 1 ? "s" : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}