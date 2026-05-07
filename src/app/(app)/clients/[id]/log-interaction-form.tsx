"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";

const TIPO_LABELS = {
  CALL: "Llamada",
  MEETING: "Reunión",
  EMAIL: "Email",
  NOTE: "Nota",
} as const;

export function LogInteractionForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<"CALL" | "MEETING" | "EMAIL" | "NOTE">("NOTE");
  const [descripcion, setDescripcion] = useState("");

  const close = () => {
    setTipo("NOTE");
    setDescripcion("");
    setError(null);
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      setError("La descripción es requerida.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, tipo, descripcion }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Error al registrar.");
      return;
    }
    router.refresh();
    close();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Registrar
      </button>
    );
  }

  return (
    <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">Registrar interacción</p>
        <button onClick={close} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          {(Object.keys(TIPO_LABELS) as Array<keyof typeof TIPO_LABELS>).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                tipo === t
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {TIPO_LABELS[t]}
            </button>
          ))}
        </div>
        <textarea
          className={INPUT + " resize-none"}
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describí brevemente la interacción..."
          required
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}