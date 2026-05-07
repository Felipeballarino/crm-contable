import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  alertEmail: z.union([z.string().email(), z.literal("")]).optional(),
  alertDaysBefore: z.number().int().min(1).max(60).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studio = await prisma.studio.findUnique({
    where: { id: session.user.studioId },
    select: { id: true, name: true, alertEmail: true, alertDaysBefore: true },
  });

  return NextResponse.json(studio);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo los administradores pueden modificar la configuración" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { alertEmail, ...rest } = parsed.data;
  const studio = await prisma.studio.update({
    where: { id: session.user.studioId },
    data: {
      ...rest,
      ...(alertEmail !== undefined && { alertEmail: alertEmail || null }),
    },
    select: { id: true, name: true, alertEmail: true, alertDaysBefore: true },
  });

  return NextResponse.json(studio);
}
