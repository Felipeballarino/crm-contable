"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Check, Search, Loader2, X } from "lucide-react";

// No .default() or .transform() — avoids the input/output type split that
// breaks Resolver<T>. Defaults are supplied via useForm's defaultValues.
const formSchema = z.object({
  razonSocial: z.string().min(2, "Mínimo 2 caracteres").max(200),
  cuit: z.string().regex(/^\d{2}-?\d{8}-?\d{1}$/, "CUIT inválido (formato: XX-XXXXXXXX-X)"),
  tipoSocietario: z.string().max(100).optional(),
  condicionIva: z.string().max(100).optional(),
  actividadPrincipal: z.string().max(200).optional(),
  inicioActividad: z.string().optional(),
  inscriptoIIBB: z.boolean(),
  contactoNombre: z.string().max(100).optional(),
  contactoEmail: z.union([z.string().min(1).email("Email inválido"), z.literal("")]).optional(),
  contactoTel: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  domicilio: z.string().max(300).optional(),
  responsableId: z.string().optional(),
  honorarios: z.number().positive().optional(),
  notas: z.string().max(5000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = ["Datos fiscales", "Contacto", "Configuración"];

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";
const LABEL = "block text-sm font-medium text-slate-700 mb-1";
const ERROR = "text-red-500 text-xs mt-1";

export function NewClientForm({ users }: { users: { id: string; name: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cuitLoading, setCuitLoading] = useState(false);
  const [cuitError, setCuitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { inscriptoIIBB: false, status: "ACTIVE" },
  });

  const lookupCuit = async () => {
    const cuitValue = document.querySelector<HTMLInputElement>('input[name="cuit"]')?.value;
    if (!cuitValue) return;

    const cleanCuit = cuitValue.replace(/\D/g, "");
    if (cleanCuit.length !== 11) {
      setCuitError("Ingresá un CUIT válido de 11 dígitos");
      return;
    }

    setCuitLoading(true);
    setCuitError(null);

    try {
      const res = await fetch(`/api/clients/lookup-cuit?cuit=${cleanCuit}`);
      const data = await res.json();

      if (!res.ok) {
        setCuitError(data.error ?? "Error al consultar AFIP");
        return;
      }

      // Auto-fill form fields
      if (data.razonSocial) setValue("razonSocial", data.razonSocial);
      if (data.condicionIva) setValue("condicionIva", data.condicionIva);
      if (data.actividadPrincipal) setValue("actividadPrincipal", data.actividadPrincipal);
      if (data.inicioActividad) {
        const date = new Date(data.inicioActividad).toISOString().slice(0, 10);
        setValue("inicioActividad", date);
      }
      if (data.domicilio) setValue("domicilio", data.domicilio);
      if (data.tipoSocietario) setValue("tipoSocietario", data.tipoSocietario);
    } catch {
      setCuitError("Error de conexión al consultar AFIP");
    } finally {
      setCuitLoading(false);
    }
  };

  const next = async () => {
    if (step === 0 && !(await trigger(["razonSocial", "cuit"]))) return;
    setStep((s) => Math.min(s + 1, 2));
  };

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    const payload = {
      ...data,
      inicioActividad: data.inicioActividad
        ? new Date(data.inicioActividad).toISOString()
        : undefined,
      honorarios: data.honorarios && !isNaN(data.honorarios) ? data.honorarios : undefined,
      responsableId: data.responsableId || undefined,
    };

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setApiError(err.error ?? "Error al crear el cliente");
      return;
    }

    const client = await res.json();
    router.push(`/clients/${client.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-colors ${
                i < step
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : i === step
                  ? "border-indigo-600 text-indigo-600 bg-white"
                  : "border-slate-300 text-slate-400 bg-white"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`ml-2 text-sm ${
                i === step ? "font-medium text-slate-900" : "text-slate-400"
              }`}
            >
              {label}
            </span>
            {i < 2 && (
              <div
                className={`w-10 h-0.5 mx-4 ${i < step ? "bg-indigo-600" : "bg-slate-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Razón social *</label>
            <input {...register("razonSocial")} className={INPUT} placeholder="Empresa S.A." />
            {errors.razonSocial && <p className={ERROR}>{errors.razonSocial.message}</p>}
          </div>
          <div>
            <label className={LABEL}>CUIT *</label>
            <div className="flex gap-2">
              <input {...register("cuit")} className={INPUT + " flex-1"} placeholder="20-12345678-9" />
              <button
                type="button"
                onClick={lookupCuit}
                disabled={cuitLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 shrink-0"
                title="Buscar datos en AFIP"
              >
                {cuitLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{cuitLoading ? "Buscando..." : "Buscar"}</span>
              </button>
            </div>
            {errors.cuit && <p className={ERROR}>{errors.cuit.message}</p>}
            {cuitError && (
              <div className="flex items-center gap-1 mt-1">
                <X className="h-3 w-3 text-amber-500" />
                <p className="text-xs text-amber-600">{cuitError}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Tipo societario</label>
              <select {...register("tipoSocietario")} className={INPUT}>
                <option value="">— Seleccionar —</option>
                {["S.A.", "S.R.L.", "S.A.S.", "Monotributo", "Resp. Inscripto", "Exento", "Otro"].map(
                  (v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className={LABEL}>Condición IVA</label>
              <select {...register("condicionIva")} className={INPUT}>
                <option value="">— Seleccionar —</option>
                {[
                  "Responsable Inscripto",
                  "Monotributista",
                  "Exento",
                  "No Responsable",
                  "Consumidor Final",
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Actividad principal</label>
            <input
              {...register("actividadPrincipal")}
              className={INPUT}
              placeholder="Ej: Comercio mayorista de alimentos"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Inicio de actividades</label>
              <input {...register("inicioActividad")} type="date" className={INPUT} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register("inscriptoIIBB")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Inscripto en IIBB</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Nombre del contacto</label>
            <input {...register("contactoNombre")} className={INPUT} placeholder="Juan Pérez" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Email</label>
              <input
                {...register("contactoEmail")}
                type="email"
                className={INPUT}
                placeholder="contacto@empresa.com"
              />
              {errors.contactoEmail && <p className={ERROR}>{errors.contactoEmail.message}</p>}
            </div>
            <div>
              <label className={LABEL}>Teléfono</label>
              <input
                {...register("contactoTel")}
                className={INPUT}
                placeholder="+54 11 1234-5678"
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>WhatsApp</label>
            <input
              {...register("whatsapp")}
              className={INPUT}
              placeholder="+54 9 11 1234-5678"
            />
          </div>
          <div>
            <label className={LABEL}>Domicilio</label>
            <input
              {...register("domicilio")}
              className={INPUT}
              placeholder="Av. Corrientes 1234, CABA"
            />
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Responsable</label>
            <select {...register("responsableId")} className={INPUT}>
              <option value="">— Sin asignar —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Honorarios mensuales</label>
            <input
              {...register("honorarios", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className={INPUT}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={LABEL}>Estado</label>
            <select {...register("status")} className={INPUT}>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Notas internas</label>
            <textarea
              {...register("notas")}
              rows={4}
              className={INPUT}
              placeholder="Observaciones, información relevante..."
            />
          </div>
        </div>
      )}

      {apiError && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {apiError}
        </div>
      )}

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
        ) : (
          <div />
        )}

        {step < 2 ? (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Guardando..." : "Crear cliente"}
            <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
