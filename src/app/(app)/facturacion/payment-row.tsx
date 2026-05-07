"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
import Link from "next/link";

type Payment = {
  id: string;
  amount: number;
  status: "PENDING" | "PAID";
  paidAt: Date | string | null;
  notas: string | null;
  client: {
    id: string;
    razonSocial: string;
    responsable: { id: string; name: string } | null;
  };
};

export function PaymentRow({ payment }: { payment: Payment }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: payment.status === "PAID" ? "PENDING" : "PAID",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al actualizar el pago");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const amount = payment.amount;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <Link
          href={`/clients/${payment.client.id}`}
          className="text-sm font-medium text-slate-900 hover:text-indigo-600"
        >
          {payment.client.razonSocial}
        </Link>
        {payment.client.responsable && (
          <p className="text-xs text-slate-400 mt-0.5">{payment.client.responsable.name}</p>
        )}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-slate-800 tabular-nums">
        ${amount.toLocaleString("es-AR")}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            payment.status === "PAID"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {payment.status === "PAID" ? "Cobrado" : "Pendiente"}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">
        {payment.paidAt
          ? new Date(payment.paidAt).toLocaleDateString("es-AR")
          : "—"}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-end gap-1">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
          onClick={toggle}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            payment.status === "PAID"
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          {payment.status === "PAID" ? (
            <><RotateCcw className="h-3 w-3" /> Desmarcar</>
          ) : (
            <><Check className="h-3 w-3" /> Marcar cobrado</>
          )}
        </button>
        </div>
      </td>
    </tr>
  );
}
