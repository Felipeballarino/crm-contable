import { z } from "zod";

const CUIT_REGEX = /^\d{2}-?\d{8}-?\d{1}$/;

export const createClientSchema = z.object({
  razonSocial: z
    .string()
    .min(2, "La razón social debe tener al menos 2 caracteres")
    .max(200),
  cuit: z
    .string()
    .regex(CUIT_REGEX, "CUIT inválido (formato: XX-XXXXXXXX-X)")
    .transform((v) => v.replace(/-/g, "")),
  tipoSocietario: z.string().max(100).optional().nullable(),
  condicionIva: z.string().max(100).optional().nullable(),
  actividadPrincipal: z.string().max(200).optional().nullable(),
  inicioActividad: z.string().datetime().optional().nullable(),
  inscriptoIIBB: z.boolean().default(false),
  contactoNombre: z.string().max(100).optional().nullable(),
  contactoEmail: z.string().email("Email inválido").optional().nullable(),
  contactoTel: z.string().max(30).optional().nullable(),
  whatsapp: z.string().max(30).optional().nullable(),
  domicilio: z.string().max(300).optional().nullable(),
  responsableId: z.string().cuid().optional().nullable(),
  honorarios: z.number().positive().optional().nullable(),
  notas: z.string().max(5000).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const clientQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  responsableId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
