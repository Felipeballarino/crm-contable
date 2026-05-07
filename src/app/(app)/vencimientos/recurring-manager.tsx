"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, RefreshCw, Repeat, Pencil } from "lucide-react";

type Client = { id: string; razonSocial: string };
type Template = {
  id: string;
  tipo: string;
  descripcion: string | null;
  dayOfMonth: number;
  client: { id: string; razonSocial: string };
};

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

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function NewTemplateModal({ clients, onCreated }: { clients: Client[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [tipo, setTipo] = useState("");
  const [tipoCustom, setTipoCustom] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("20");

  const close = () => {
    setClientId(""); setTipo(""); setTipoCustom(""); setDescripcion(""); setDayOfMonth("20");
    setError(null); setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tipoFinal = tipo === "Otro" ? tipoCustom : tipo;
    if (!clientId || !tipoFinal || !dayOfMonth) { setError("Todos los campos son requeridos."); return; }
    setLoading(true); setError(null);
    const res = await fetch("/api/recurring-expirations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, tipo: tipoFinal, descripcion, dayOfMonth: parseInt(dayOfMonth) }),
    });
    setLoading(false);
    if (!res.ok) { setError("Error al crear la plantilla."); return; }
    onCreated();
    close();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Nueva plantilla
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Nueva plantilla recurrente</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Cliente</label>
                <select className={INPUT} value={clientId} onChange={e => setClientId(e.target.value)} required>
                  <option value="">Seleccioná un cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Tipo de vencimiento</label>
                <select className={INPUT} value={tipo} onChange={e => setTipo(e.target.value)} required>
                  <option value="">Seleccioná un tipo...</option>
                  {TIPOS_COMUNES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {tipo === "Otro" && (
                <div>
                  <label className={LABEL}>Especificá el tipo</label>
                  <input className={INPUT} value={tipoCustom} onChange={e => setTipoCustom(e.target.value)} required />
                </div>
              )}
              <div>
                <label className={LABEL}>Día del mes</label>
                <input type="number" min="1" max="31" className={INPUT} value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} required />
                <p className="text-xs text-slate-400 mt-1">El vencimiento se generará ese día cada mes. Si el mes tiene menos días, se usa el último día disponible.</p>
              </div>
              <div>
                <label className={LABEL}>Descripción <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input className={INPUT} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Declaración mensual" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
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

function GenerateModal({ onGenerated }: { onGenerated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const generate = async () => {
    setLoading(true); setResult(null);
    const res = await fetch("/api/recurring-expirations/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: parseInt(month), year: parseInt(year) }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
    if (data.created > 0) onGenerated();
  };

  return (
    <>
      <button onClick={() => { setResult(null); setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
        <RefreshCw className="h-3.5 w-3.5" />
        Generar mes
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Generar vencimientos del mes</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-600">Crea los vencimientos de todas las plantillas activas para el mes seleccionado. Los que ya existen se saltean.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Mes</label>
                  <select className={INPUT} value={month} onChange={e => setMonth(e.target.value)}>
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Año</label>
                  <input type="number" className={INPUT} value={year} onChange={e => setYear(e.target.value)} min="2020" max="2100" />
                </div>
              </div>
              {result && (
                <div className={`rounded-lg p-3 text-sm ${result.created > 0 ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-600"}`}>
                  {result.created > 0
                    ? `✓ Se crearon ${result.created} vencimiento${result.created !== 1 ? "s" : ""}.`
                    : "Todos los vencimientos ya existían."}
                  {result.skipped > 0 && ` (${result.skipped} ya existían)`}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cerrar</button>
                <button onClick={generate} disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {loading ? "Generando..." : "Generar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EditTemplateModal({
  template,
  onClose,
  onSaved,
}: {
  template: Template;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tipo, setTipo] = useState(template.tipo);
  const [tipoCustom, setTipoCustom] = useState(TIPOS_COMUNES.includes(template.tipo) ? "" : template.tipo);
  const [descripcion, setDescripcion] = useState(template.descripcion ?? "");
  const [dayOfMonth, setDayOfMonth] = useState(String(template.dayOfMonth));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tipoFinal = tipo === "Otro" ? tipoCustom : tipo;
    if (!tipoFinal || !dayOfMonth) { setError("Todos los campos son requeridos."); return; }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/recurring-expirations/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: tipoFinal, descripcion, dayOfMonth: parseInt(dayOfMonth) }),
    });
    setLoading(false);
    if (!res.ok) { setError("Error al actualizar la plantilla."); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Editar plantilla</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className={LABEL}>Tipo de vencimiento</label>
            <select className={INPUT} value={tipo} onChange={e => setTipo(e.target.value)} required>
              {TIPOS_COMUNES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {tipo === "Otro" && (
            <div>
              <label className={LABEL}>Especificá el tipo</label>
              <input className={INPUT} value={tipoCustom} onChange={e => setTipoCustom(e.target.value)} required />
            </div>
          )}
          <div>
            <label className={LABEL}>Día del mes</label>
            <input type="number" min="1" max="31" className={INPUT} value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Descripción <span className="text-slate-400 font-normal">(opcional)</span></label>
            <input className={INPUT} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RecurringManager({
  templates,
  clients,
}: {
  templates: Template[];
  clients: Client[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla? No se eliminarán los vencimientos ya generados.")) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/recurring-expirations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al eliminar");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-slate-400" />
          <h2 className="font-medium text-slate-900 text-sm">Plantillas recurrentes</h2>
          <span className="text-xs text-slate-400">({templates.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <NewTemplateModal clients={clients} onCreated={() => router.refresh()} />
          <GenerateModal onGenerated={() => router.refresh()} />
        </div>
      </div>

      {error && (
        <div className="px-5 py-2 text-xs text-red-500 bg-red-50 border-b border-red-100">{error}</div>
      )}
      {templates.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          <Repeat className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No hay plantillas recurrentes.</p>
          <p className="text-xs mt-1">Creá una plantilla para generar vencimientos automáticamente cada mes.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500">Cliente</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500">Tipo</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500">Descripción</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500">Día del mes</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {templates.map(tpl => (
              <tr key={tpl.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-800 font-medium">{tpl.client.razonSocial}</td>
                <td className="px-5 py-3 text-slate-700">{tpl.tipo}</td>
                <td className="px-5 py-3 text-slate-500">{tpl.descripcion ?? "—"}</td>
                <td className="px-5 py-3 text-slate-500">Día {tpl.dayOfMonth}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(tpl)} className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(tpl.id)} disabled={deleting === tpl.id} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50" title="Eliminar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing && (
        <EditTemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}