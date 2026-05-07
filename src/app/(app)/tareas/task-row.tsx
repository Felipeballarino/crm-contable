"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";

type Task = {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: Date | string | null;
  client: { id: string; razonSocial: string };
  assignedTo: { id: string; name: string } | null;
};

const PRIORITY_STYLES = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700",
};
const PRIORITY_LABELS = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" };

const STATUS_NEXT: Record<Task["status"], Task["status"]> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};
const STATUS_LABELS = { TODO: "Pendiente", IN_PROGRESS: "En curso", DONE: "Hecho" };
const STATUS_STYLES = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

export function TaskRow({ task }: { task: Task }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advanceStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: STATUS_NEXT[task.status] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al actualizar la tarea");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al eliminar la tarea");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue =
    dueDate && task.status !== "DONE" && dueDate < new Date();

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <Link
          href={`/clients/${task.client.id}`}
          className="text-sm font-medium text-slate-900 hover:text-indigo-600"
        >
          {task.client.razonSocial}
        </Link>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-slate-800">{task.titulo}</p>
        {task.descripcion && (
          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{task.descripcion}</p>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.prioridad]}`}
        >
          {PRIORITY_LABELS[task.prioridad]}
        </span>
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        {dueDate ? (
          <span className={isOverdue ? "text-red-600 font-medium" : "text-slate-500"}>
            {dueDate.toLocaleDateString("es-AR")}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">
        {task.assignedTo?.name ?? "—"}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}
        >
          {STATUS_LABELS[task.status]}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-end gap-1">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <div className="flex items-center gap-2">
          {task.status !== "DONE" && (
            <button
              onClick={advanceStatus}
              disabled={loading}
              title={`Pasar a "${STATUS_LABELS[STATUS_NEXT[task.status]]}"`}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {STATUS_LABELS[STATUS_NEXT[task.status]]}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={remove}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          </div>
        </div>
      </td>
    </tr>
  );
}