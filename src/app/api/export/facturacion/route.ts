import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

  const payments = await prisma.payment.findMany({
    where: { studioId, month, year },
    orderBy: [{ status: "asc" }, { client: { razonSocial: "asc" } }],
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

  const rows = payments.map((p) => ({
    Cliente: p.client.razonSocial,
    CUIT: p.client.cuit,
    Responsable: p.client.responsable?.name ?? "",
    "Honorarios ($)": Number(p.amount),
    Estado: p.status === "PAID" ? "Cobrado" : "Pendiente",
    "Fecha de pago": p.paidAt ? new Date(p.paidAt).toLocaleDateString("es-AR") : "",
    Notas: p.notas ?? "",
  }));

  // Summary rows
  const totalEsperado = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalCobrado = payments.filter(p => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
  const totalPendiente = totalEsperado - totalCobrado;

  rows.push({} as typeof rows[0]);
  rows.push({ Cliente: "TOTAL ESPERADO", CUIT: "", Responsable: "", "Honorarios ($)": totalEsperado, Estado: "", "Fecha de pago": "", Notas: "" });
  rows.push({ Cliente: "TOTAL COBRADO", CUIT: "", Responsable: "", "Honorarios ($)": totalCobrado, Estado: "", "Fecha de pago": "", Notas: "" });
  rows.push({ Cliente: "TOTAL PENDIENTE", CUIT: "", Responsable: "", "Honorarios ($)": totalPendiente, Estado: "", "Fecha de pago": "", Notas: "" });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  const label = `${MESES[month - 1]}-${year}`;
  XLSX.utils.book_append_sheet(wb, ws, `Facturación ${label}`);

  ws["!cols"] = [
    { wch: 35 }, { wch: 16 }, { wch: 18 },
    { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 25 },
  ];

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="facturacion-${label}.xlsx"`,
    },
  });
}
