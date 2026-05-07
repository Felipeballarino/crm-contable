import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StudioSettingsForm } from "./studio-settings-form";
import { TaxRulesSection } from "./tax-rules-section";

export default async function ConfiguracionPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [studio, taxRules] = await Promise.all([
    prisma.studio.findUnique({
      where: { id: session.user.studioId },
      select: { name: true, alertEmail: true, alertDaysBefore: true },
    }),
    prisma.taxRule.findMany({
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!studio) redirect("/dashboard");

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ajustes del estudio, alertas y calendario fiscal</p>
      </div>
      <StudioSettingsForm studio={studio} isAdmin={session.user.role === "ADMIN"} />
      <TaxRulesSection rules={taxRules} isAdmin={session.user.role === "ADMIN"} />
    </div>
  );
}
