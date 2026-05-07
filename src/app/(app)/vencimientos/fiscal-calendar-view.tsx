"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Loader2, AlertTriangle } from "lucide-react";

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

type ClientAssignment = {
  id: string;
  clientId: string;
  taxRuleId: string;
  activo: boolean;
  taxRule: TaxRule;
};

const FRECUENCIA_LABELS: Record<string, string> = {
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  ANNUAL: "Anual",
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function FiscalCalendarView() {
  const router = useRouter();
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tax-rules")
      .then((res) => res.json())
      .then((data) => {
        setRules(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    setMessage(null);
    const res = await fetch("/api/tax-rules/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setGenerating(false);
    if (!res.ok) {
      setMessage("Error al generar vencimientos fiscales");
      return;
    }
    const data = await res.json();
    setMessage(
      `✓ Se generaron ${data.created} vencimientos fiscales para ${data.clientsProcessed} clientes (${data.skipped} ya existían)`
    );
    router.refresh();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
        <Loader2 className="h-6 w-6 mx-auto text-slate-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Cargando calendario fiscal...</p>
      </div>
    );
  }

  const activeRules = rules.filter((r) => r.activo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Calendario Fiscal Argentino
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Vencimientos calculados automáticamente según el CUIT de cada cliente y las reglas de AFIP.
            </p>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {generating ? "Generando..." : "Generar vencimientos del año"}
          </button>
        </div>

        {message && (
          <div className={`mt-4 rounded-lg p-3 text-sm flex items-start gap-2 ${
            message.startsWith("Error") || message.startsWith("✓") ? "" : ""
          } ${message.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
            {message.startsWith("Error") ? (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            {message}
          </div>
        )}
      </div>

      {/* Rules summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-medium text-slate-900 text-sm">Impuestos configurados</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeRules.length} activos de {rules.length} reglas
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {rules.map((rule) => (
            <div key={rule.id} className={`px-6 py-4 ${!rule.activo ? "opacity-40" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{rule.nombre}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      rule.frecuencia === "MONTHLY" ? "bg-blue-50 text-blue-700" :
                      rule.frecuencia === "QUARTERLY" ? "bg-purple-50 text-purple-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {FRECUENCIA_LABELS[rule.frecuencia]}
                    </span>
                    {!rule.activo && (
                      <span className="text-xs text-slate-400">(inactiva)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Aplica a: {rule.aplicaA.join(", ")} · Meses: {rule.mesesAplicacion.map((m) => MESES[m - 1]).join(", ")}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Días CUIT</p>
                  <p className="font-mono text-slate-500">{rule.diasVencimiento.join(", ")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h3 className="text-sm font-medium text-indigo-900 mb-2">¿Cómo funciona?</h3>
        <ul className="text-sm text-indigo-700 space-y-1.5">
          <li>• Al crear un cliente, se le asignan automáticamente los impuestos según su condición IVA.</li>
          <li>• Las fechas de vencimiento se calculan según el último dígito del CUIT, como lo hace AFIP.</li>
          <li>• Podés generar todos los vencimientos del año con un clic.</li>
          <li>• Los vencimientos se marcan como enviados para no duplicarlos.</li>
          <li>• Podés editar las reglas de días en Configuración si AFIP cambia el calendario.</li>
        </ul>
      </div>
    </div>
  );
}
