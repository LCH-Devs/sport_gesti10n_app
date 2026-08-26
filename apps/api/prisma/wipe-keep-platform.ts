import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1`,
  );
  console.log(
    'Tablas:',
    tables.map((t) => t.tablename).join(', '),
  );

  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Admin" CASCADE`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Socio" CASCADE`);

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SocioActividad",
      "Asistencia",
      "Partido",
      "Reserva",
      "CobroProfe",
      "LiquidacionProfe",
      "Pago",
      "Horario",
      "Espacio",
      "Noticia",
      "Torneo",
      "Actividad",
      "GrupoFamiliar",
      "Membresia",
      "Usuario",
      "Club"
    RESTART IDENTITY CASCADE
  `);

  await prisma.platformAdmin.deleteMany({
    where: { email: { not: 'platform@clubapp.com' } },
  });

  const password_hash = await bcrypt.hash('platform123', 10);
  await prisma.platformAdmin.upsert({
    where: { email: 'platform@clubapp.com' },
    update: {
      nombre: 'Superadmin ClubApp',
      password_hash,
      activo: true,
    },
    create: {
      email: 'platform@clubapp.com',
      nombre: 'Superadmin ClubApp',
      password_hash,
      activo: true,
    },
  });

  const after = {
    clubs: await prisma.club.count(),
    usuarios: await prisma.usuario.count(),
    membresias: await prisma.membresia.count(),
    platform: await prisma.platformAdmin.findMany({
      select: { email: true, nombre: true, activo: true },
    }),
  };
  console.log(after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
