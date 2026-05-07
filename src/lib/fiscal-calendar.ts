import { prisma } from "@/lib/prisma";

/**
 * Fiscal Calendar — AFIP CUIT-based expiration calculation
 *
 * AFIP determines due dates based on the last digit of the CUIT.
 * Each tax has its own schedule array of 10 days (for digits 0-9).
 */

export function getCuitLastDigit(cuit: string): number {
  const digits = cuit.replace(/\D/g, "");
  return parseInt(digits[digits.length - 1], 10);
}

export function calculateDueDate(
  regla: string,
  diasVencimiento: number[],
  month: number,
  year: number,
  cuit: string
): Date {
  const lastDigit = getCuitLastDigit(cuit);

  if (regla === "CUIT_BASED") {
    const day = diasVencimiento[lastDigit] ?? diasVencimiento[0];
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const actualDay = Math.min(day, lastDayOfMonth);
    return new Date(year, month - 1, actualDay);
  }

  if (regla === "FIXED_DAY") {
    const day = diasVencimiento[0] ?? 20;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const actualDay = Math.min(day, lastDayOfMonth);
    return new Date(year, month - 1, actualDay);
  }

  // FIXED_MONTH — for annual taxes that fall on a specific month
  const day = diasVencimiento[lastDigit] ?? diasVencimiento[0];
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const actualDay = Math.min(day, lastDayOfMonth);
  return new Date(year, month - 1, actualDay);
}

export async function getTaxRulesForClient(
  condicionIva: string | null
): Promise<{ id: string; nombre: string; descripcion: string | null; frecuencia: string; regla: string; diasVencimiento: number[]; mesesAplicacion: number[] }[]> {
  const rules = await prisma.taxRule.findMany({
    where: {
      activo: true,
      aplicaA: { has: condicionIva ?? "" },
    },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      frecuencia: true,
      regla: true,
      diasVencimiento: true,
      mesesAplicacion: true,
    },
    orderBy: { nombre: "asc" },
  });

  return rules;
}

export async function generateFiscalExpirations(
  clientId: string,
  studioId: string,
  cuit: string,
  year?: number
): Promise<{ created: number; skipped: number }> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { condicionIva: true },
  });

  if (!client) return { created: 0, skipped: 0 };

  const targetYear = year ?? new Date().getFullYear();
  const rules = await getTaxRulesForClient(client.condicionIva);

  // Get already-assigned tax rules for this client
  const assignedRules = await prisma.clientTaxAssignment.findMany({
    where: { studioId, clientId },
    select: { taxRuleId: true, activo: true },
  });

  const assignedRuleIds = new Set(assignedRules.map((a) => a.taxRuleId));

  // Auto-assign rules that aren't assigned yet
  for (const rule of rules) {
    if (!assignedRuleIds.has(rule.id)) {
      await prisma.clientTaxAssignment.create({
        data: { studioId, clientId, taxRuleId: rule.id },
      });
    }
  }

  // Get active assignments
  const activeAssignments = await prisma.clientTaxAssignment.findMany({
    where: { studioId, clientId, activo: true },
    include: { taxRule: true },
  });

  let created = 0;
  let skipped = 0;

  for (const assignment of activeAssignments) {
    const rule = assignment.taxRule;

    for (const month of rule.mesesAplicacion) {
      const dueDate = calculateDueDate(
        rule.regla,
        rule.diasVencimiento,
        month,
        targetYear,
        cuit
      );

      // Check if already exists
      const startOfDay = new Date(dueDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dueDate);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const exists = await prisma.expiration.findFirst({
        where: {
          studioId,
          clientId,
          tipo: rule.nombre,
          fechaVencimiento: { gte: startOfDay, lt: endOfDay },
        },
      });

      if (exists) {
        skipped++;
        continue;
      }

      const descripcion = rule.frecuencia === "ANNUAL"
        ? `Período fiscal ${targetYear}`
        : `${rule.nombre} — ${getMonthName(month)} ${targetYear}`;

      await prisma.expiration.create({
        data: {
          studioId,
          clientId,
          tipo: rule.nombre,
          descripcion,
          fechaVencimiento: dueDate,
        },
      });
      created++;
    }
  }

  return { created, skipped };
}

export async function generateFiscalExpirationsForStudio(
  studioId: string,
  year?: number
): Promise<{ created: number; skipped: number; clientsProcessed: number }> {
  const targetYear = year ?? new Date().getFullYear();

  const clients = await prisma.client.findMany({
    where: { studioId, status: "ACTIVE" },
    select: { id: true, cuit: true },
  });

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const client of clients) {
    const result = await generateFiscalExpirations(
      client.id,
      studioId,
      client.cuit,
      targetYear
    );
    totalCreated += result.created;
    totalSkipped += result.skipped;
  }

  return {
    created: totalCreated,
    skipped: totalSkipped,
    clientsProcessed: clients.length,
  };
}

function getMonthName(month: number): string {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return months[month - 1] ?? "";
}
