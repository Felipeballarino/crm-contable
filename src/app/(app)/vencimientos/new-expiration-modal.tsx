"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

type Client = { id: string; razonSocial: string };

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";
const LABEL = "block text-sm font-medium text-slate-700 mb-1";

const TIPOS_COMUNES = [
  "IVA",
  "Ganancias",
  "Bienes Personales",
  "Ingresos Brutos (IIBB)",
  "Cargas Sociales (F931)",
  "Autónomos",
  "Retenciones / SICORE",
  "Estados Contables",
  "Monotributo",
  "Otro",
];

export function NewExpirationModal({
  clients,
  defaultClientId,
}: {
  clients: Client[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [tipo, setTipo] = useState("");
  const [tipoCustom, setTipoCustom] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");

  const reset = () => {
    setClientId(defaultClientId ?? "");
    setTipo("");
    setTipoCustom("");
    setDescripcion("");
    setFecha("");
    setError(null);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tipoFinal = tipo === "Otro" ? tipoCustom : tipo;
    if (!clientId || !tipoFinal || !fecha) {
      setError("Cliente, tipo y fecha son requeridos.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/expirations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, tipo: tipoFinal, descripcion, fechaVencimiento: fecha }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.fieldErrors ? "Revisá los campos." : "Error al crear.");
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
        Nuevo vencimiento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Nuevo vencimiento</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              {!defaultClientId && (
                <div>
                  <label className={LABEL}>Cliente</label>
                  <select
                    className={INPUT}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">Seleccioná un cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.razonSocial}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={LABEL}>Tipo de vencimiento</label>
                <select
                  className={INPUT}
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  required
                >
                  <option value="">Seleccioná un tipo...</option>
                  {TIPOS_COMUNES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {tipo === "Otro" && (
                <div>
                  <label className={LABEL}>Especificá el tipo</label>
                  <input
                    className={INPUT}
                    value={tipoCustom}
                    onChange={(e) => setTipoCustom(e.target.value)}
                    placeholder="Ej: Presentación especial AFIP"
                    required
                  />
                </div>
              )}

              <div>
                <label className={LABEL}>Fecha de vencimiento</label>
                <input
                  type="date"
                  className={INPUT}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={LABEL}>
                  Descripción <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  className={INPUT}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Período julio 2026"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}