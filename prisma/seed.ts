import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const studio = await prisma.studio.upsert({
    where: { slug: "mi-estudio" },
    update: {},
    create: {
      name: "Mi Estudio Contable",
      slug: "mi-estudio",
      plan: "FREE",
    },
  });

  const hash = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { studioId_email: { studioId: studio.id, email: "admin@estudio.com" } },
    update: {},
    create: {
      studioId: studio.id,
      name: "Administrador",
      email: "admin@estudio.com",
      password: hash,
      role: "ADMIN",
    },
  });

  console.log("✓ Studio:", studio.name, `(id: ${studio.id})`);
  console.log("✓ Usuario:", user.email, "/ contraseña: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
