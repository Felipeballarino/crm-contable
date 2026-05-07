"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

type Client = { id: string; razonSocial: string };
type User = { id: string; name: string };

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";
const LABEL = "block text-sm font-medium text-slate-700 mb-1";

export function NewTaskModal({
  clients,
  users,
  defaultClientId,
}: {
  clients: Client[];
  users: User[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  const reset = () => {
    setClientId(defaultClientId ?? "");
    setTitulo("");
    setDescripcion("");
    setPrioridad("MEDIUM");
    setDueDate("");
    setAssignedToId("");
    setError(null);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !titulo) {
      setError("Cliente y título son requeridos.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        titulo,
        descripcion: descripcion || undefined,
        prioridad,
        dueDate: dueDate || undefined,
        assignedToId: assignedToId || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Error al crear la tarea.");
      return;
    }
    router.refresh();
    close();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nueva tarea
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Nueva tarea</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              {!defaultClientId && (
                <div>
                  <label className={LABEL}>Cliente</label>
                  <select
                    className={INPUT}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">Seleccioná un cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.razonSocial}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={LABEL}>Título</label>
                <input
                  className={INPUT}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Presentar declaración jurada IVA"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Prioridad</label>
                  <select
                    className={INPUT}
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Fecha límite</label>
                  <input
                    type="date"
                    className={INPUT}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {users.length > 0 && (
                <div>
                  <label className={LABEL}>
                    Asignada a <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <select
                    className={INPUT}
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                  >
                    <option value="">Sin asignar</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={LABEL}>
                  Descripción <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  className={INPUT + " resize-none"}
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles adicionales..."
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}