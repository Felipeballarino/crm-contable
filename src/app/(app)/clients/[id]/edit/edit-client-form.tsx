"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const formSchema = z.object({
  razonSocial: z.string().min(2, "Mínimo 2 caracteres").max(200),
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

type Client = {
  id: string;
  cuit: string;
  razonSocial: string;
  tipoSocietario: string | null;
  condicionIva: string | null;
  actividadPrincipal: string | null;
  inicioActividad: Date | string | null;
  inscriptoIIBB: boolean;
  contactoNombre: string | null;
  contactoEmail: string | null;
  contactoTel: string | null;
  whatsapp: string | null;
  domicilio: string | null;
  responsableId: string | null;
  honorarios: number | null;
  notas: string | null;
  status: "ACTIVE" | "INACTIVE";
};

const STEPS = ["Datos fiscales", "Contacto", "Configuración"];
const INPUT = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";
const LABEL = "block text-sm font-medium text-slate-700 mb-1";
const ERROR = "text-red-500 text-xs mt-1";

export function EditClientForm({
  client,
  users,
}: {
  client: Client;
  users: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razonSocial: client.razonSocial,
      tipoSocietario: client.tipoSocietario ?? "",
      condicionIva: client.condicionIva ?? "",
      actividadPrincipal: client.actividadPrincipal ?? "",
      inicioActividad: client.inicioActividad
        ? new Date(client.inicioActividad).toISOString().slice(0, 10)
        : "",
      inscriptoIIBB: client.inscriptoIIBB,
      contactoNombre: client.contactoNombre ?? "",
      contactoEmail: client.contactoEmail ?? "",
      contactoTel: client.contactoTel ?? "",
      whatsapp: client.whatsapp ?? "",
      domicilio: client.domicilio ?? "",
      responsableId: client.responsableId ?? "",
      honorarios: client.honorarios ?? undefined,
      notas: client.notas ?? "",
      status: client.status,
    },
  });

  const next = async () => {
    if (step === 0 && !(await trigger(["razonSocial"]))) return;
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

    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setApiError(err.error ?? "Error al guardar los cambios");
      return;
    }

    router.push(`/clients/${client.id}`);
    router.refresh();
  };

  return (
    <form onKeyDown={(e) => {
      if (e.key === "Enter" && e.target instanceof HTMLElement && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    }}>
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-colors ${
              i < step ? "bg-indigo-600 border-indigo-600 text-white"
              : i === step ? "border-indigo-600 text-indigo-600 bg-white"
              : "border-slate-300 text-slate-400 bg-white"
            }`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`ml-2 text-sm ${i === step ? "font-medium text-slate-900" : "text-slate-400"}`}>
              {label}
            </span>
            {i < 2 && <div className={`w-10 h-0.5 mx-4 ${i < step ? "bg-indigo-600" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Razón social *</label>
            <input {...register("razonSocial")} className={INPUT} />
            {errors.razonSocial && <p className={ERROR}>{errors.razonSocial.message}</p>}
          </div>
          <div>
            <label className={LABEL}>CUIT</label>
            <input value={client.cuit} disabled className={INPUT + " bg-slate-50 text-slate-400 cursor-not-allowed"} />
            <p className="text-xs text-slate-400 mt-1">El CUIT no puede modificarse.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Tipo societario</label>
              <select {...register("tipoSocietario")} className={INPUT}>
                <option value="">— Seleccionar —</option>
                {["S.A.", "S.R.L.", "S.A.S.", "Monotributo", "Resp. Inscripto", "Exento", "Otro"].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Condición IVA</label>
              <select {...register("condicionIva")} className={INPUT}>
                <option value="">— Seleccionar —</option>
                {["Responsable Inscripto", "Monotributista", "Exento", "No Responsable", "Consumidor Final"].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Actividad principal</label>
            <input {...register("actividadPrincipal")} className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Inicio de actividades</label>
              <input {...register("inicioActividad")} type="date" className={INPUT} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register("inscriptoIIBB")} type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
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
            <input {...register("contactoNombre")} className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Email</label>
              <input {...register("contactoEmail")} type="email" className={INPUT} />
              {errors.contactoEmail && <p className={ERROR}>{errors.contactoEmail.message}</p>}
            </div>
            <div>
              <label className={LABEL}>Teléfono</label>
              <input {...register("contactoTel")} className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>WhatsApp</label>
            <input {...register("whatsapp")} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Domicilio</label>
            <input {...register("domicilio")} className={INPUT} />
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
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Honorarios mensuales</label>
            <input {...register("honorarios", { valueAsNumber: true })} type="number" step="0.01" min="0" className={INPUT} />
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
            <textarea {...register("notas")} rows={4} className={INPUT} />
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
          <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
        ) : (
          <div />
        )}
        {step < 2 ? (
          <button type="button" onClick={next} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {isSubmitting ? "Guardando..." : "Guardar cambios"} <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
