"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";

type Interaction = {
  id: string;
  tipo: "CALL" | "MEETING" | "EMAIL" | "NOTE";
  descripcion: string;
  date: Date | string;
  user: { id: string; name: string };
};

const TIPO_LABELS = {
  CALL: "Llamada",
  MEETING: "Reunión",
  EMAIL: "Email",
  NOTE: "Nota",
} as const;

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";
const LABEL = "block text-sm font-medium text-slate-700 mb-1";

function EditInteractionModal({
  interaction,
  onClose,
  onSaved,
}: {
  interaction: Interaction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tipo, setTipo] = useState(interaction.tipo);
  const [descripcion, setDescripcion] = useState(interaction.descripcion);
  const [date, setDate] = useState(
    new Date(interaction.date).toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      setError("La descripción es requerida");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/interactions/${interaction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, descripcion, date: new Date(date).toISOString() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al actualizar");
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Editar interacción</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className={LABEL}>Tipo</label>
            <select className={INPUT} value={tipo} onChange={(e) => setTipo(e.target.value as Interaction["tipo"])}>
              {Object.entries(TIPO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Descripción</label>
            <textarea className={INPUT} rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Fecha</label>
            <input type="datetime-local" className={INPUT} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InteractionItem({ interaction }: { interaction: Interaction }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (!confirm("¿Eliminar esta interacción?")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/interactions/${interaction.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al eliminar");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {TIPO_LABELS[interaction.tipo]}
          </span>
          <span className="text-xs text-slate-400">
            {new Date(interaction.date).toLocaleDateString("es-AR")} · {interaction.user.name}
          </span>
        </div>
        <p className="text-sm text-slate-700">{interaction.descripcion}</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={() => setEditing(true)}
            className="rounded p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Editar"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={remove}
            disabled={deleting}
            className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Eliminar"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {editing && (
        <EditInteractionModal
          interaction={interaction}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

export function InteractionsSection({
  interactions,
}: {
  interactions: Interaction[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="font-medium text-slate-900 text-sm">Historial de interacciones</h2>
      </div>
      {interactions.length === 0 ? (
        <p className="text-center py-8 text-sm text-slate-400">
          Sin interacciones registradas
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {interactions.map((int) => (
            <InteractionItem key={int.id} interaction={int} />
          ))}
        </div>
      )}
    </div>
  );
}
