import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  DONE: "Hecho",
  OVERDUE: "Vencido",
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { searchParams } = new URL(req.url);
  const today = new Date();
  const month = parseInt(searchParams.get("month") ?? String(today.getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(today.getFullYear()));

  const expirations = await prisma.expiration.findMany({
    where: {
      studioId,
      fechaVencimiento: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    orderBy: { fechaVencimiento: "asc" },
    include: {
      client: {
        select: {
          razonSocial: true,
          cuit: true,
          responsable: { select: { name: true } },
        },
      },
    },
  });

  const rows = expirations.map((e) => ({
    Cliente: e.client.razonSocial,
    CUIT: e.client.cuit,
    Responsable: e.client.responsable?.name ?? "",
    Tipo: e.tipo,
    Descripción: e.descripcion ?? "",
    "Fecha de vencimiento": new Date(e.fechaVencimiento).toLocaleDateString("es-AR"),
    Estado: STATUS_LABELS[e.status] ?? e.status,
    "Alerta enviada": e.alertSent ? "Sí" : "No",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vencimientos");

  ws["!cols"] = [
    { wch: 35 }, { wch: 16 }, { wch: 18 }, { wch: 22 },
    { wch: 25 }, { wch: 22 }, { wch: 12 }, { wch: 16 },
  ];

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const label = `${MESES[month - 1]}-${year}`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="vencimientos-${label}.xlsx"`,
    },
  });
}
