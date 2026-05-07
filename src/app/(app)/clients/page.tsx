import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatusPill } from "@/components/ui/status-pill";
import { ClientAvatar } from "@/components/ui/client-avatar";
import { ClientsSearch } from "./clients-search";
import { formatCuit } from "@/lib/utils";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const { studioId } = session.user;
  const search = params.search ?? "";
  const statusFilter = params.status as "ACTIVE" | "INACTIVE" | undefined;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const limit = 20;

  const where = {
    studioId,
    ...(statusFilter && { status: statusFilter }),
    ...(search && {
      OR: [
        { razonSocial: { contains: search, mode: "insensitive" as const } },
        { cuit: { contains: search } },
        { contactoEmail: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { razonSocial: "asc" },
      include: {
        responsable: { select: { id: true, name: true } },
        _count: {
          select: {
            expirations: { where: { status: "PENDING" } },
          },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
        <div className="flex items-center gap-2">
          <ExportButton href="/api/export/clients" label="Exportar Excel" />
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Link>
        </div>
      </div>

      <Suspense>
        <ClientsSearch defaultSearch={search} defaultStatus={statusFilter} />
      </Suspense>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4">
        {clients.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            {search
              ? "No hay clientes que coincidan con la búsqueda"
              : "No hay clientes registrados aún"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Cliente</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">CUIT</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Estado</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Responsable</th>
                <th className="text-right px-6 py-3 font-medium text-slate-500">Venc. pend.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <ClientAvatar name={client.razonSocial} size="sm" />
                      <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {client.razonSocial}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {formatCuit(client.cuit)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={client.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {client.responsable?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {client._count.expirations > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {client._count.expirations}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>{total} clientes en total</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/clients?page=${page - 1}${search ? `&search=${search}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Anterior
              </Link>
            )}
            <span className="px-3 py-1 text-slate-400">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/clients?page=${page + 1}${search ? `&search=${search}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
