import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { lookupCuit } from "@/lib/afip";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cuit = searchParams.get("cuit");

  if (!cuit) {
    return NextResponse.json({ error: "CUIT requerido" }, { status: 400 });
  }

  // Validate CUIT format (11 digits)
  const cleanCuit = cuit.replace(/\D/g, "");
  if (cleanCuit.length !== 11) {
    return NextResponse.json({ error: "El CUIT debe tener 11 dígitos" }, { status: 400 });
  }

  const result = await lookupCuit(cleanCuit);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
