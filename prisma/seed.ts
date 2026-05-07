import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const studio = await prisma.studio.upsert({
    where: { slug: "mi-estudio" },
    update: {},
    create: {
      name: "Mi Estudio Contable",
      slug: "mi-estudio",
      plan: "FREE",
    },
  });

  const hash = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { studioId_email: { studioId: studio.id, email: "admin@estudio.com" } },
    update: {},
    create: {
      studioId: studio.id,
      name: "Administrador",
      email: "admin@estudio.com",
      password: hash,
      role: "ADMIN",
    },
  });

  console.log("✓ Studio:", studio.name, `(id: ${studio.id})`);
  console.log("✓ Usuario:", user.email, "/ contraseña: admin123");

  // ─── Fiscal Calendar Tax Rules ──────────────────────────────────────────
  // These are based on AFIP's CUIT-based expiration formulas
  // The last digit of CUIT determines the due date

  const taxRules = [
    {
      nombre: "IVA",
      descripcion: "Impuesto al Valor Agregado — Declaración mensual (F. 700)",
      frecuencia: "MONTHLY",
      regla: "CUIT_BASED",
      diasVencimiento: [10, 14, 17, 20, 23, 26, 30, 3, 6, 9],
      mesesAplicacion: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      aplicaA: ["Responsable Inscripto"],
    },
    {
      nombre: "Ganancias",
      descripcion: "Impuesto a las Ganancias — Pago mensual a cuenta",
      frecuencia: "MONTHLY",
      regla: "CUIT_BASED",
      diasVencimiento: [11, 15, 18, 21, 24, 27, 31, 4, 7, 10],
      mesesAplicacion: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      aplicaA: ["Responsable Inscripto"],
    },
    {
      nombre: "SICORE",
      descripcion: "Sistema de Recaudación y Control — Retenciones y percepciones",
      frecuencia: "MONTHLY",
      regla: "CUIT_BASED",
      diasVencimiento: [12, 16, 19, 22, 25, 28, 1, 5, 8, 11],
      mesesAplicacion: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      aplicaA: ["Responsable Inscripto"],
    },
    {
      nombre: "Bienes Personales",
      descripcion: "Impuesto sobre los Bienes Personales — Declaración anual",
      frecuencia: "ANNUAL",
      regla: "CUIT_BASED",
      diasVencimiento: [15, 20, 25, 30, 5, 10, 15, 20, 25, 30],
      mesesAplicacion: [6],
      aplicaA: ["Responsable Inscripto"],
    },
    {
      nombre: "F931 (Cargas Sociales)",
      descripcion: "Declaración de cargas sociales — Obras sociales, jubilaciones, etc.",
      frecuencia: "MONTHLY",
      regla: "CUIT_BASED",
      diasVencimiento: [13, 17, 20, 23, 26, 29, 2, 6, 9, 12],
      mesesAplicacion: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      aplicaA: ["Responsable Inscripto"],
    },
    {
      nombre: "Autónomos",
      descripcion: "Aportes previsionales para trabajadores autónomos",
      frecuencia: "MONTHLY",
      regla: "FIXED_DAY",
      diasVencimiento: [20],
      mesesAplicacion: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      aplicaA: ["Responsable Inscripto", "Monotributista"],
    },
    {
      nombre: "Monotributo",
      descripcion: "Pago mensual integrado del Monotributo",
      frecuencia: "MONTHLY",
      regla: "CUIT_BASED",
      diasVencimiento: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
      mesesAplicacion: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      aplicaA: ["Monotributista"],
    },
  ];

  for (const rule of taxRules) {
    await prisma.taxRule.upsert({
      where: { nombre: rule.nombre },
      update: rule,
      create: rule,
    });
    console.log(`✓ Regla fiscal: ${rule.nombre}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
