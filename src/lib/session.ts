import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import type { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  studioId: string;
  name: string;
  email: string;
  role: Role;
}

export async function getSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = await cookies();
  const tokenCookie =
    cookieStore.get("next-auth.session-token") ??
    cookieStore.get("__Secure-next-auth.session-token");

  if (!tokenCookie?.value) return null;

  try {
    const token = await decode({
      token: tokenCookie.value,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.id || !token?.studioId) return null;

    return {
      user: {
        id: token.id as string,
        studioId: token.studioId as string,
        name: (token.name as string) ?? "",
        email: (token.email as string) ?? "",
        role: token.role as Role,
      },
    };
  } catch {
    return null;
  }
}
