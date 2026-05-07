"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";
const LABEL = "block text-sm font-medium text-slate-700 mb-1";

export function NewUserModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");

  const close = () => {
    setName(""); setEmail(""); setPassword(""); setRole("STAFF"); setError(null);
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear el usuario.");
      return;
    }
    router.refresh();
    close();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nuevo usuario
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Nuevo usuario</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Nombre</label>
                <input className={INPUT} value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input type="email" className={INPUT} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className={LABEL}>Contraseña</label>
                <input type="password" className={INPUT} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
              </div>
              <div>
                <label className={LABEL}>Rol</label>
                <select className={INPUT} value={role} onChange={e => setRole(e.target.value as "ADMIN" | "STAFF")}>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  El administrador puede crear y eliminar usuarios.
                </p>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {loading ? "Guardando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}