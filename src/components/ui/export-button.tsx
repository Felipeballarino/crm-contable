"use client";
import { useState } from "react";
import { Download, AlertCircle } from "lucide-react";

export function ExportButton({ href, label }: { href: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(href);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Error al exportar los datos");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "export.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = decodeURIComponent(filename);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Error de conexión al intentar exportar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={download}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {loading ? "Exportando..." : (label ?? "Exportar Excel")}
      </button>
      {error && (
        <div className="absolute top-full mt-1 left-0 flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1 whitespace-nowrap">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
