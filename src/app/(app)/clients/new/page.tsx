import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NewClientForm } from "./new-client-form";

export default async function NewClientPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const users = await prisma.user.findMany({
    where: { studioId: session.user.studioId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Clientes
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Nuevo cliente</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <NewClientForm users={users} />
      </div>
    </div>
  );
}
