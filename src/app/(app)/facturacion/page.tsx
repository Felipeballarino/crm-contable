import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaymentRow } from "./payment-row";
import { GenerateButton } from "./generate-button";
import { ExportButton } from "@/components/ui/export-button";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function prevMonth(m: number, y: number) {
  return m === 1 ? { month: 12, year: y - 1 } : { month: m - 1, year: y };
}
function nextMonth(m: number, y: number) {
  return m === 12 ? { month: 1, year: y + 1 } : { month: m + 1, year: y };
}

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { studioId } = session.user;
  const params = await searchParams;
  const today = new Date();
  const month = params.month ? parseInt(params.month) : today.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : today.getFullYear();

  const payments = await prisma.payment.findMany({
    where: { studioId, month, year },
    orderBy: [{ status: "asc" }, { client: { razonSocial: "asc" } }],
    include: {
      client: {
        select: {
          id: true,
          razonSocial: true,
          responsable: { select: { id: true, name: true } },
        },
      },
    },
  });

  const totalEsperado = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCobrado = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPendiente = totalEsperado - totalCobrado;
  const cobrados = payments.filter((p) => p.status === "PAID").length;
  const pendientes = payments.filter((p) => p.status === "PENDING").length;

  const prev = prevMonth(month, year);
  const next = nextMonth(month, year);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Facturación</h1>
          <ExportButton href={`/api/export/facturacion?month=${month}&year=${year}`} label="Exportar Excel" />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/facturacion?month=${prev.month}&year=${prev.year}`}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <span className="text-base font-semibold text-slate-800 w-44 text-center">
            {MESES[month - 1]} {year}
          </span>
          <Link
            href={`/facturacion?month=${next.month}&year=${next.year}`}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 mb-1">Total esperado</p>
          <p className="text-2xl font-bold text-slate-900">
            ${totalEsperado.toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-slate-400 mt-1">{payments.length} clientes</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 mb-1">Cobrado</p>
          <p className="text-2xl font-bold text-green-600">
            ${totalCobrado.toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-slate-400 mt-1">{cobrados} cobrado{cobrados !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 mb-1">Pendiente</p>
          <p className="text-2xl font-bold text-amber-600">
            ${totalPendiente.toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-slate-400 mt-1">{pendientes} pendiente{pendientes !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Barra de progreso */}
      {totalEsperado > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progreso de cobro</span>
            <span>{Math.round((totalCobrado / totalEsperado) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(totalCobrado / totalEsperado) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-900 text-sm">Detalle por cliente</h2>
          <GenerateButton month={month} year={year} />
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <p>No hay cobros para este mes.</p>
            <p className="text-xs mt-1">Hacé click en &quot;Generar cobros del mes&quot; para crearlos automáticamente.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Cliente</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Honorarios</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Estado</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Fecha de pago</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <PaymentRow key={payment.id} payment={{ ...payment, amount: Number(payment.amount) }} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
