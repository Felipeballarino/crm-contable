import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Expiration = {
  id: string;
  tipo: string;
  fechaVencimiento: Date;
  status: "PENDING" | "DONE" | "OVERDUE";
  client: { id: string; razonSocial: string };
};

const STATUS_COLOR = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  OVERDUE: "bg-red-100 text-red-800 border-red-200",
  DONE: "bg-green-100 text-green-700 border-green-200",
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function prevMonth(month: number, year: number) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}
function nextMonth(month: number, year: number) {
  return month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
}

export function CalendarView({
  expirations,
  month,
  year,
}: {
  expirations: Expiration[];
  month: number;
  year: number;
}) {
  // Build a map: day number → expirations[]
  const byDay = new Map<number, Expiration[]>();
  for (const exp of expirations) {
    const d = new Date(exp.fechaVencimiento).getDate();
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(exp);
  }

  // First day of month (0=Sun..6=Sat), convert to Mon-first (0=Mon..6=Sun)
  const firstDow = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  const prev = prevMonth(month, year);
  const next = nextMonth(month, year);

  // Build cells array: null for padding, number for actual days
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <Link
          href={`/vencimientos?view=calendar&month=${prev.month}&year=${prev.year}`}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-base font-semibold text-slate-900">
          {MESES[month - 1]} {year}
        </h2>
        <Link
          href={`/vencimientos?view=calendar&month=${next.month}&year=${next.year}`}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-slate-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-slate-100">
        {cells.map((day, i) => {
          const isToday = isCurrentMonth && day === today.getDate();
          const exps = day ? (byDay.get(day) ?? []) : [];
          const rowStart = i % 7 === 0;

          return (
            <div
              key={i}
              className={`min-h-[100px] p-1.5 ${rowStart ? "" : ""} ${
                i >= 7 ? "border-t border-slate-100" : ""
              } ${day ? "bg-white" : "bg-slate-50/50"}`}
            >
              {day && (
                <>
                  <div className="flex justify-end mb-1">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {exps.slice(0, 3).map((exp) => (
                      <Link
                        key={exp.id}
                        href={`/clients/${exp.client.id}`}
                        className={`block rounded border px-1.5 py-0.5 text-xs truncate leading-tight hover:opacity-80 transition-opacity ${STATUS_COLOR[exp.status]}`}
                        title={`${exp.client.razonSocial} — ${exp.tipo}`}
                      >
                        <span className="font-medium">{exp.tipo}</span>
                        <span className="text-[10px] block truncate opacity-75">
                          {exp.client.razonSocial}
                        </span>
                      </Link>
                    ))}
                    {exps.length > 3 && (
                      <p className="text-[10px] text-slate-400 pl-1">
                        +{exps.length - 3} más
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-slate-100 bg-slate-50">
        <span className="text-xs text-slate-400">Referencias:</span>
        {(["PENDING", "OVERDUE", "DONE"] as const).map((s) => (
          <span key={s} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${STATUS_COLOR[s]}`}>
            {s === "PENDING" ? "Pendiente" : s === "OVERDUE" ? "Vencido" : "Hecho"}
          </span>
        ))}
      </div>
    </div>
  );
}