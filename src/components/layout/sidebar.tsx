"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BookOpen, LayoutDashboard, Users, LogOut, CalendarClock, CheckSquare, UserCog, Settings, DollarSign, FolderOpen } from "lucide-react";
import { GlobalSearch } from "./global-search";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", Icon: Users },
  { href: "/vencimientos", label: "Vencimientos", Icon: CalendarClock },
  { href: "/tareas", label: "Tareas", Icon: CheckSquare },
  { href: "/facturacion", label: "Facturación", Icon: DollarSign },
  { href: "/documentos", label: "Documentos", Icon: FolderOpen },
  { href: "/usuarios", label: "Usuarios", Icon: UserCog },
  { href: "/configuracion", label: "Configuración", Icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex flex-col h-full w-60 shrink-0 bg-slate-900 text-slate-100">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-700/60">
        <BookOpen className="h-5 w-5 text-indigo-400" />
        <span className="font-semibold tracking-tight">CRM Contable</span>
      </div>

      <div className="pt-3 pb-1">
        <GlobalSearch />
      </div>

      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/60">
        <p className="text-xs font-medium text-slate-300 truncate">{session?.user?.name}</p>
        <p className="text-xs text-slate-500 truncate mb-3">{session?.user?.email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
