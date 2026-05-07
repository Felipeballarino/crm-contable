"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, CalendarClock, CheckSquare, X } from "lucide-react";

type Results = {
  clients: { id: string; razonSocial: string; cuit: string; status: string }[];
  expirations: {
    id: string; tipo: string; fechaVencimiento: string; status: string;
    client: { id: string; razonSocial: string };
  }[];
  tasks: {
    id: string; titulo: string; status: string; prioridad: string;
    client: { id: string; razonSocial: string };
  }[];
};

const STATUS_EXP: Record<string, string> = { PENDING: "Pendiente", OVERDUE: "Vencido", DONE: "Hecho" };
const STATUS_TASK: Record<string, string> = { TODO: "Pendiente", IN_PROGRESS: "En curso", DONE: "Hecho" };

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  };

  const hasResults = results && (
    results.clients.length > 0 || results.expirations.length > 0 || results.tasks.length > 0
  );
  const isEmpty = results && !hasResults;

  return (
    <div ref={containerRef} className="relative px-3 mb-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar..."
          className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-8 pr-7 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-slate-400">Buscando...</div>
          )}

          {!loading && isEmpty && (
            <div className="px-4 py-3 text-sm text-slate-400">
              Sin resultados para &quot;{query}&quot;
            </div>
          )}

          {!loading && hasResults && (
            <>
              {results.clients.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Clientes</span>
                  </div>
                  {results.clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/clients/${c.id}`)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">{c.razonSocial}</p>
                      <p className="text-xs text-slate-400">{c.cuit}</p>
                    </button>
                  ))}
                </div>
              )}

              {results.expirations.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vencimientos</span>
                  </div>
                  {results.expirations.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => navigate(`/clients/${e.client.id}`)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">{e.tipo}</p>
                      <p className="text-xs text-slate-400">
                        {e.client.razonSocial} · {new Date(e.fechaVencimiento).toLocaleDateString("es-AR")} · {STATUS_EXP[e.status]}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tareas</span>
                  </div>
                  {results.tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/clients/${t.client.id}`)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <p className="text-sm font-medium text-slate-900">{t.titulo}</p>
                      <p className="text-xs text-slate-400">
                        {t.client.razonSocial} · {STATUS_TASK[t.status]}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
