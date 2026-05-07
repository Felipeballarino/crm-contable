import { prisma } from "@/lib/prisma";

export async function syncOverdue(studioId: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  await prisma.expiration.updateMany({
    where: {
      studioId,
      status: "PENDING",
      fechaVencimiento: { lt: now },
    },
    data: { status: "OVERDUE" },
  });
}
