"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Building2, Save } from "lucide-react";

type Studio = {
  name: string;
  alertEmail: string | null;
  alertDaysBefore: number;
};

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";
const LABEL = "block text-sm font-medium text-slate-700 mb-1";

export function StudioSettingsForm({ studio, isAdmin }: { studio: Studio; isAdmin: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(studio.name);
  const [alertEmail, setAlertEmail] = useState(studio.alertEmail ?? "");
  const [alertDaysBefore, setAlertDaysBefore] = useState(String(studio.alertDaysBefore));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    const res = await fetch("/api/studio", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        alertEmail,
        alertDaysBefore: parseInt(alertDaysBefore),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar.");
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Datos del estudio */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Datos del estudio</h2>
        </div>
        <div>
          <label className={LABEL}>Nombre del estudio</label>
          <input
            className={INPUT}
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={!isAdmin}
            required
          />
        </div>
      </div>

      {/* Configuración de alertas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Alertas de vencimientos</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Email de destino</label>
            <input
              type="email"
              className={INPUT}
              value={alertEmail}
              onChange={e => setAlertEmail(e.target.value)}
              placeholder="admin@muestudio.com"
              disabled={!isAdmin}
            />
            <p className="text-xs text-slate-400 mt-1">
              Las alertas de vencimientos se enviarán a este email.
            </p>
          </div>
          <div>
            <label className={LABEL}>Días de anticipación</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="60"
                className={INPUT + " w-24"}
                value={alertDaysBefore}
                onChange={e => setAlertDaysBefore(e.target.value)}
                disabled={!isAdmin}
              />
              <span className="text-sm text-slate-500">días antes del vencimiento</span>
            </div>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Solo los administradores pueden modificar la configuración.
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {isAdmin && (
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && <span className="text-sm text-green-600">✓ Guardado</span>}
        </div>
      )}
    </form>
  );
}
