import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { FileText, FileImage, File, Download, Trash2 } from "lucide-react";
import Link from "next/link";

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType === "application/pdf" || mimeType.includes("text")) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { studioId } = session.user;

  const documents = await prisma.document.findMany({
    where: { studioId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      client: { select: { id: true, razonSocial: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  const totalSize = documents.reduce((sum, d) => sum + d.size, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Documentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            {documents.length} documento{documents.length !== 1 ? "s" : ""} · {formatSize(totalSize)} en total
          </p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No hay documentos subidos</p>
          <p className="text-sm text-slate-400 mt-1">
            Subí archivos desde la ficha de cada cliente.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Archivo</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Cliente</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Subido por</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Fecha</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Tamaño</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const Icon = fileIcon(doc.mimeType);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 truncate max-w-xs">
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/clients/${doc.client.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        {doc.client.razonSocial}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{doc.uploadedBy.name}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatSize(doc.size)}</td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/api/documents/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
