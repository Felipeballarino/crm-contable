"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { NewTaskModal } from "@/app/(app)/tareas/new-task-modal";

type Task = {
  id: string;
  titulo: string;
  prioridad: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: Date | string | null;
  assignedTo: { id: string; name: string } | null;
};

type User = { id: string; name: string };

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

function TaskItem({ task }: { task: Task }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advance = async () => {
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
        setError(data.error ?? "Error al actualizar");
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
  const isOverdue = dueDate && task.status !== "DONE" && dueDate < new Date();

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{task.titulo}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.prioridad]}`}>
            {PRIORITY_LABELS[task.prioridad]}
          </span>
          {dueDate && (
            <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-slate-400"}`}>
              {dueDate.toLocaleDateString("es-AR")}
            </span>
          )}
          {task.assignedTo && (
            <span className="text-xs text-slate-400">→ {task.assignedTo.name}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
        {task.status !== "DONE" && (
          <button
            onClick={advance}
            disabled={loading}
            title={`Pasar a "${STATUS_LABELS[STATUS_NEXT[task.status]]}"`}
            className="rounded-lg p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ClientTasksSection({
  tasks,
  clientId,
  clientName,
  users,
}: {
  tasks: Task[];
  clientId: string;
  clientName: string;
  users: User[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="font-medium text-slate-900 text-sm">Tareas</h2>
        <NewTaskModal
          clients={[{ id: clientId, razonSocial: clientName }]}
          users={users}
          defaultClientId={clientId}
        />
      </div>
      {tasks.length === 0 ? (
        <p className="text-center py-8 text-sm text-slate-400">Sin tareas registradas</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}