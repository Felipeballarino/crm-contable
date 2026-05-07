"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, Trash2, FileText, FileImage, File } from "lucide-react";

type Document = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: Date | string;
  uploadedBy: { name: string };
};

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

export function DocumentsSection({
  documents,
  clientId,
}: {
  documents: Document[];
  clientId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId);

    const res = await fetch("/api/documents", { method: "POST", body: formData });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al subir el archivo.");
      return;
    }
    router.refresh();
  };

  const download = (id: string) => {
    window.open(`/api/documents/${id}`, "_blank");
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este documento?")) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al eliminar el documento");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="font-medium text-slate-900 text-sm">Documentos</h2>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={upload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Subiendo..." : "Subir archivo"}
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400">
          Sin documentos adjuntos
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {documents.map((doc) => {
            const Icon = fileIcon(doc.mimeType);
            return (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                <Icon className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString("es-AR")} · {doc.uploadedBy.name}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => download(doc.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(doc.id)}
                    disabled={deleting === doc.id}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
