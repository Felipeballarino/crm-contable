"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { ExpirationBadge } from "@/components/ui/expiration-badge";
import Link from "next/link";

type Expiration = {
  id: string;
  tipo: string;
  descripcion: string | null;
  fechaVencimiento: Date | string;
  status: "PENDING" | "DONE" | "OVERDUE";
  client: { id: string; razonSocial: string };
};

export function ExpirationRow({ exp }: { exp: Expiration }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markDone = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expirations/${exp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al actualizar el vencimiento");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!confirm("¿Eliminar este vencimiento?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expirations/${exp.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al eliminar el vencimiento");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const fecha = new Date(exp.fechaVencimiento);

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <Link
          href={`/clients/${exp.client.id}`}
          className="text-sm font-medium text-slate-900 hover:text-indigo-600"
        >
          {exp.client.razonSocial}
        </Link>
      </td>
      <td className="px-6 py-4 text-sm text-slate-700">{exp.tipo}</td>
      <td className="px-6 py-4 text-sm text-slate-500">{exp.descripcion ?? "—"}</td>
      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
        {fecha.toLocaleDateString("es-AR")}
      </td>
      <td className="px-6 py-4">
        {exp.status === "DONE" ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Hecho
          </span>
        ) : (
          <ExpirationBadge date={exp.fechaVencimiento} />
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-end gap-1">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <div className="flex items-center justify-end gap-2">
          {exp.status !== "DONE" && (
            <button
              onClick={markDone}
              disabled={loading}
              title="Marcar como hecho"
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Hecho
            </button>
          )}
          <button
            onClick={remove}
            disabled={loading}
            title="Eliminar"
            className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          </div>
        </div>
      </td>
    </tr>
  );
}