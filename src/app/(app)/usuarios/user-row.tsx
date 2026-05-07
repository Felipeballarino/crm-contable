"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Shield, User } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  createdAt: Date | string;
};

export function UserRow({ user, currentUserId }: { user: User; currentUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSelf = user.id === currentUserId;

  const remove = async () => {
    if (!confirm(`¿Eliminar al usuario ${user.name}? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al eliminar el usuario");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-indigo-700">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {user.name}
              {isSelf && <span className="ml-2 text-xs text-slate-400">(vos)</span>}
            </p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            user.role === "ADMIN"
              ? "bg-purple-100 text-purple-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {user.role === "ADMIN" ? (
            <Shield className="h-3 w-3" />
          ) : (
            <User className="h-3 w-3" />
          )}
          {user.role === "ADMIN" ? "Administrador" : "Staff"}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">
        {new Date(user.createdAt).toLocaleDateString("es-AR")}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-end gap-1">
          {error && <span className="text-xs text-red-500">{error}</span>}
          {!isSelf && (
          <button
            onClick={remove}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Eliminar usuario"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          )}
        </div>
      </td>
    </tr>
  );
}