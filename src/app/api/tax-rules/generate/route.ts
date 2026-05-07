import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { generateFiscalExpirationsForStudio } from "@/lib/fiscal-calendar";

const schema = z.object({
  year: z.number().int().min(2020).max(2100).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studioId } = session.user;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await generateFiscalExpirationsForStudio(studioId, parsed.data.year);

  return NextResponse.json(result);
}
