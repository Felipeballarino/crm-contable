import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const payments = await prisma.payment.findMany({
    where: { studioId, month, year },
    orderBy: [{ status: "asc" }, { client: { razonSocial: "asc" } }],
    include: { client: { select: { id: true, razonSocial: true, responsable: { select: { id: true, name: true } } } } },
  });

  return NextResponse.json(payments);
}
