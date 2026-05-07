import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatusPill } from "@/components/ui/status-pill";
import { ClientAvatar } from "@/components/ui/client-avatar";
import { ExpirationBadge } from "@/components/ui/expiration-badge";
import { formatCuit } from "@/lib/utils";
import { ChevronLeft, Phone, Mail, MessageSquare, MapPin, Pencil } from "lucide-react";
import { AddExpirationButton } from "./add-expiration-button";
import { LogInteractionForm } from "./log-interaction-form";
import { ClientTasksSection } from "./client-tasks-section";
import { DocumentsSection } from "./documents-section";
import { InteractionsSection } from "./interactions-section";

export default async function ClientDetailPage({
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
      include: {
        responsable: { select: { id: true, name: true } },
        expirations: {
          where: { status: { not: "DONE" } },
          orderBy: { fechaVencimiento: "asc" },
          take: 15,
        },
        tasks: {
          where: { status: { not: "DONE" } },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
          take: 15,
          include: { assignedTo: { select: { id: true, name: true } } },
        },
        interactions: {
          orderBy: { date: "desc" },
          take: 15,
          include: { user: { select: { id: true, name: true } } },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          include: { uploadedBy: { select: { name: true } } },
        },
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
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5"
      >
        <ChevronLeft className="h-4 w-4" />
        Clientes
      </Link>

      <div className="flex items-start gap-4 mb-7">
        <ClientAvatar name={client.razonSocial} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-slate-900 truncate">
              {client.razonSocial}
            </h1>
            <StatusPill status={client.status} />
          </div>
          <p className="text-slate-500 font-mono text-sm">{formatCuit(client.cuit)}</p>
          {(client.tipoSocietario || client.condicionIva) && (
            <p className="text-slate-400 text-sm mt-0.5">
              {[client.tipoSocietario, client.condicionIva].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="text-right text-sm text-slate-500 shrink-0 space-y-1">
          {client.responsable && (
            <div>
              Responsable:{" "}
              <span className="font-medium text-slate-700">{client.responsable.name}</span>
            </div>
          )}
          {client.honorarios && (
            <div>${Number(client.honorarios).toLocaleString("es-AR")}/mes</div>
          )}
          <div className="pt-1">
            <Link
              href={`/clients/${client.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar cliente
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Sidebar info */}
        <div className="space-y-4">
          {(client.contactoNombre ||
            client.contactoEmail ||
            client.contactoTel ||
            client.whatsapp ||
            client.domicilio) && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="text-sm font-medium text-slate-900 mb-3">Contacto</h2>
              <div className="space-y-2 text-sm text-slate-600">
                {client.contactoNombre && (
                  <p className="font-medium text-slate-800">{client.contactoNombre}</p>
                )}
                {client.contactoEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <a
                      href={`mailto:${client.contactoEmail}`}
                      className="hover:text-indigo-600 truncate"
                    >
                      {client.contactoEmail}
                    </a>
                  </div>
                )}
                {client.contactoTel && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {client.contactoTel}
                  </div>
                )}
                {client.whatsapp && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {client.whatsapp}
                  </div>
                )}
                {client.domicilio && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    {client.domicilio}
                  </div>
                )}
              </div>
            </div>
          )}

          {client.actividadPrincipal && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="text-sm font-medium text-slate-900 mb-2">Actividad</h2>
              <p className="text-sm text-slate-600">{client.actividadPrincipal}</p>
              {client.inscriptoIIBB && (
                <span className="inline-block mt-2 text-xs text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                  Inscripto IIBB
                </span>
              )}
            </div>
          )}

          {client.notas && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="text-sm font-medium text-slate-900 mb-2">Notas</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{client.notas}</p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="col-span-2 space-y-4">
          {/* Vencimientos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h2 className="font-medium text-slate-900 text-sm">Vencimientos pendientes</h2>
              <AddExpirationButton clientId={client.id} clientName={client.razonSocial} />
            </div>
            {client.expirations.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400">
                Sin vencimientos pendientes
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {client.expirations.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{exp.tipo}</p>
                      {exp.descripcion && (
                        <p className="text-xs text-slate-500 mt-0.5">{exp.descripcion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500">
                        {new Date(exp.fechaVencimiento).toLocaleDateString("es-AR")}
                      </span>
                      <ExpirationBadge date={exp.fechaVencimiento} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tareas */}
          <ClientTasksSection
            tasks={client.tasks}
            clientId={client.id}
            clientName={client.razonSocial}
            users={users}
          />

          {/* Documentos */}
          <DocumentsSection documents={client.documents} clientId={client.id} />

          {/* Historial de interacciones */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h2 className="font-medium text-slate-900 text-sm">Registrar interacción</h2>
              <LogInteractionForm clientId={client.id} />
            </div>
          </div>
          <InteractionsSection interactions={client.interactions} />
        </div>
      </div>
    </div>
  );
}