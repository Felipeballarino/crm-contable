import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NewUserModal } from "./new-user-modal";
import { UserRow } from "./user-row";

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { studioId, id: currentUserId, role } = session.user;

  const users = await prisma.user.findMany({
    where: { studioId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {users.length} usuario{users.length !== 1 ? "s" : ""} en el estudio
          </p>
        </div>
        {role === "ADMIN" && <NewUserModal />}
      </div>

      {role !== "ADMIN" && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Solo los administradores pueden crear o eliminar usuarios.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-slate-500">Usuario</th>
              <th className="text-left px-6 py-3 font-medium text-slate-500">Rol</th>
              <th className="text-left px-6 py-3 font-medium text-slate-500">Creado</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <UserRow key={user.id} user={user} currentUserId={currentUserId} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}