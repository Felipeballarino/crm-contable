import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCuit } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { studioId: session.user.studioId },
    orderBy: { razonSocial: "asc" },
    include: { responsable: { select: { name: true } } },
  });

  const rows = clients.map((c) => ({
    "Razón Social": c.razonSocial,
    CUIT: formatCuit(c.cuit),
    "Condición IVA": c.condicionIva ?? "",
    "Tipo Societario": c.tipoSocietario ?? "",
    "Actividad Principal": c.actividadPrincipal ?? "",
    "Inscripto IIBB": c.inscriptoIIBB ? "Sí" : "No",
    "Contacto": c.contactoNombre ?? "",
    Email: c.contactoEmail ?? "",
    Teléfono: c.contactoTel ?? "",
    WhatsApp: c.whatsapp ?? "",
    Domicilio: c.domicilio ?? "",
    Responsable: c.responsable?.name ?? "",
    "Honorarios ($/mes)": c.honorarios ? Number(c.honorarios) : "",
    Estado: c.status === "ACTIVE" ? "Activo" : "Inactivo",
    "Alta en sistema": new Date(c.createdAt).toLocaleDateString("es-AR"),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");

  // Column widths
  ws["!cols"] = [
    { wch: 35 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 25 },
    { wch: 14 }, { wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 16 },
    { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 16 },
  ];

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="clientes-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
