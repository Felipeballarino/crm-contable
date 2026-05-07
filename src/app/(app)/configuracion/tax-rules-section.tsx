"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, Calendar } from "lucide-react";

type TaxRule = {
  id: string;
  nombre: string;
  descripcion: string | null;
  frecuencia: string;
  regla: string;
  diasVencimiento: number[];
  mesesAplicacion: number[];
  aplicaA: string[];
  activo: boolean;
};

const FRECUENCIA_LABELS: Record<string, string> = {
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  ANNUAL: "Anual",
};

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function EditRuleModal({
  rule,
  onClose,
  onSaved,
}: {
  rule: TaxRule;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [diasVencimiento, setDiasVencimiento] = useState(rule.diasVencimiento.join(", "));
  const [activo, setActivo] = useState(rule.activo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dias = diasVencimiento
      .split(",")
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d) && d >= 1 && d <= 31);

    if (dias.length === 0) {
      setError("Ingresá al menos un día válido (1-31)");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/tax-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diasVencimiento: dias, activo }),
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
          <h2 className="font-semibold text-slate-900">Editar regla: {rule.nombre}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Días de vencimiento (según último dígito de CUIT)
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={diasVencimiento}
              onChange={(e) => setDiasVencimiento(e.target.value)}
              placeholder="10, 14, 17, 20, 23, 26, 30, 3, 6, 9"
            />
            <p className="text-xs text-slate-400 mt-1">
              10 valores separados por coma, uno para cada dígito (0-9) del CUIT.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rule-active"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="rule-active" className="text-sm text-slate-700">
              Regla activa
            </label>
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

export function TaxRulesSection({ rules, isAdmin }: { rules: TaxRule[]; isAdmin: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<TaxRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const generateAll = async () => {
    setLoading(true);
    setSuccess(null);
    const res = await fetch("/api/tax-rules/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setLoading(false);
    if (!res.ok) {
      setSuccess("Error al generar vencimientos");
      return;
    }
    const data = await res.json();
    setSuccess(`✓ Se generaron ${data.created} vencimientos fiscales (${data.skipped} ya existían)`);
    router.refresh();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <h2 className="font-medium text-slate-900 text-sm">Calendario fiscal argentino</h2>
        </div>
        {isAdmin && (
          <button
            onClick={generateAll}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Generando..." : "Generar vencimientos del año"}
          </button>
        )}
      </div>

      {success && (
        <div className={`px-6 py-3 text-sm ${success.startsWith("Error") ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}>
          {success}
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {rules.map((rule) => (
          <div key={rule.id} className={`px-6 py-4 ${!rule.activo ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-slate-800">{rule.nombre}</h3>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    rule.frecuencia === "MONTHLY" ? "bg-blue-50 text-blue-700" :
                    rule.frecuencia === "QUARTERLY" ? "bg-purple-50 text-purple-700" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {FRECUENCIA_LABELS[rule.frecuencia]}
                  </span>
                  {!rule.activo && (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      Inactiva
                    </span>
                  )}
                </div>
                {rule.descripcion && (
                  <p className="text-xs text-slate-500 mb-2">{rule.descripcion}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>
                    Aplica a: {rule.aplicaA.join(", ")}
                  </span>
                  <span>
                    Meses: {rule.mesesAplicacion.map((m) => MESES[m - 1]).join(", ")}
                  </span>
                  <span>
                    Días CUIT: {rule.diasVencimiento.join(", ")}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setEditing(rule)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
                  title="Editar regla"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditRuleModal
          rule={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
