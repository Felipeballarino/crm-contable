import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TaskRow } from "./task-row";
import { NewTaskModal } from "./new-task-modal";

type StatusFilter = "TODO" | "IN_PROGRESS" | "DONE" | undefined;

const STATUS_TABS = [
  { label: "Pendientes", value: "TODO" },
  { label: "En curso", value: "IN_PROGRESS" },
  { label: "Hechas", value: "DONE" },
  { label: "Todas", value: "" },
] as const;

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { studioId } = session.user;
  const params = await searchParams;
  const statusFilter = (params.status as StatusFilter) ?? "TODO";

  const [tasks, clients, users] = await Promise.all([
    prisma.task.findMany({
      where: {
        studioId,
        ...(statusFilter && { status: statusFilter }),
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        client: { select: { id: true, razonSocial: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({
      where: { studioId, status: "ACTIVE" },
      select: { id: true, razonSocial: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.user.findMany({
      where: { studioId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Tareas</h1>
        <NewTaskModal clients={clients} users={users} />
      </div>

      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map(({ label, value }) => {
          const active = (statusFilter ?? "") === value;
          return (
            <Link
              key={value}
              href={value ? `/tareas?status=${value}` : "/tareas"}
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
        {tasks.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No hay tareas en esta categoría
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Cliente</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Tarea</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Prioridad</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Fecha límite</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Asignada a</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {tasks.length > 0 && (
        <p className="mt-3 text-xs text-slate-400 text-right">
          {tasks.length} tarea{tasks.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}