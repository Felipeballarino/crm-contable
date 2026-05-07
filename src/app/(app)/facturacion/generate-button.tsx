"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function GenerateButton({ month, year }: { month: number; year: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setMsg(null);
    const res = await fetch("/api/payments/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg("Error al generar."); return; }
    if (data.created === 0) {
      setMsg(data.message ?? "Todos los cobros ya existen para este mes.");
    } else {
      setMsg(`✓ ${data.created} cobro${data.created !== 1 ? "s" : ""} generado${data.created !== 1 ? "s" : ""}.${data.skipped > 0 ? ` (${data.skipped} ya existían)` : ""}`);
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Generar cobros del mes
      </button>
      {msg && <span className="text-sm text-slate-500">{msg}</span>}
    </div>
  );
}
