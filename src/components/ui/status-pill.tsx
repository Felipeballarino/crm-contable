type Status = "ACTIVE" | "INACTIVE" | "PENDING" | "DONE" | "OVERDUE";

const VARIANTS: Record<Status, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-700",
  DONE: "bg-blue-100 text-blue-700",
  OVERDUE: "bg-red-100 text-red-700",
};

const LABELS: Record<Status, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  PENDING: "Pendiente",
  DONE: "Completado",
  OVERDUE: "Vencido",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
