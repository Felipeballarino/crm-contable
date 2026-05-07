"use client";
import { useState } from "react";
import { Bell } from "lucide-react";

export function SendAlertsButton({ pendingCount }: { pendingCount: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const send = async () => {
    setLoading(true); setResult(null); setIsError(false);
    const res = await fetch("/api/alerts/send", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setResult(data.error ?? "Error al enviar.");
      setIsError(true);
    } else if (data.sent) {
      setResult(`✓ Alerta enviada con ${data.count} vencimiento${data.count !== 1 ? "s" : ""}.`);
    } else {
      setResult(data.message ?? "Sin vencimientos para alertar.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-4 w-4 text-indigo-500" />
            <h3 className="font-medium text-slate-900 text-sm">Alertas de vencimientos</h3>
          </div>
          <p className="text-sm text-slate-500">
            {pendingCount > 0
              ? `${pendingCount} vencimiento${pendingCount !== 1 ? "s" : ""} próximo${pendingCount !== 1 ? "s" : ""} sin alerta enviada`
              : "No hay vencimientos próximos pendientes de alerta"}
          </p>
          {result && (
            <p className={`text-sm mt-2 ${isError ? "text-red-500" : "text-green-600"}`}>
              {result}
            </p>
          )}
        </div>
        <button
          onClick={send}
          disabled={loading || pendingCount === 0}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-40"
        >
          <Bell className="h-4 w-4" />
          {loading ? "Enviando..." : "Enviar alerta"}
        </button>
      </div>
    </div>
  );
}
