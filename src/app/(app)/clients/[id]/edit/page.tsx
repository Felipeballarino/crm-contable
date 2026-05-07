import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EditClientForm } from "./edit-client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { studioId } = session.user;

  const [client, users] = await Promise.all([
    prisma.client.findFirst({
      where: { id, studioId },
      select: {
        id: true, cuit: true, razonSocial: true, tipoSocietario: true,
        condicionIva: true, actividadPrincipal: true, inicioActividad: true,
        inscriptoIIBB: true, contactoNombre: true, contactoEmail: true,
        contactoTel: true, whatsapp: true, domicilio: true,
        responsableId: true, honorarios: true, notas: true, status: true,
      },
    }),
    prisma.user.findMany({
      where: { studioId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!client) notFound();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/clients/${client.id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al cliente
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mb-8">
        Editar — {client.razonSocial}
      </h1>
      <EditClientForm
        client={{ ...client, honorarios: client.honorarios ? Number(client.honorarios) : null }}
        users={users}
      />
    </div>
  );
}
