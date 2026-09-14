import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { ReservasService } from './reservas.service';

/**
 * R15: una prueba con mocks no demuestra ausencia de doble reserva. Este
 * test pega contra el Postgres real de desarrollo (mismo DATABASE_URL que
 * usa la app) y dispara dos altas concurrentes para el mismo espacio y
 * horario — solo una debe sobrevivir, tanto a nivel de la app (transacción
 * Serializable) como a nivel de la fila (EXCLUDE constraint de respaldo).
 */
describe('ReservasService — concurrencia real contra Postgres', () => {
  const prisma = new PrismaClient();
  let clubId: number;
  let espacioId: number;
  let usuarioAId: number;
  let usuarioBId: number;
  let socioAId: number;
  let socioBId: number;
  let service: ReservasService;

  beforeAll(async () => {
    await prisma.$connect();
    service = new ReservasService(prisma as any);

    const club = await prisma.club.create({
      data: {
        slug: `test-concurrencia-${Date.now()}`,
        nombre: 'Club test concurrencia',
        max_reservas_activas: 10,
      },
    });
    clubId = club.id;

    const espacio = await prisma.espacio.create({
      data: { club_id: clubId, nombre: 'Cancha 1', tipo: 'cancha' },
    });
    espacioId = espacio.id;

    const usuarioA = await prisma.usuario.create({
      data: {
        email: `socio-a-${Date.now()}@test.com`,
        password_hash: 'x',
        nombre: 'Socio A',
      },
    });
    const usuarioB = await prisma.usuario.create({
      data: {
        email: `socio-b-${Date.now()}@test.com`,
        password_hash: 'x',
        nombre: 'Socio B',
      },
    });
    const socioA = await prisma.membresia.create({
      data: { usuario_id: usuarioA.id, club_id: clubId, rol: 'socio' },
    });
    const socioB = await prisma.membresia.create({
      data: { usuario_id: usuarioB.id, club_id: clubId, rol: 'socio' },
    });
    usuarioAId = usuarioA.id;
    usuarioBId = usuarioB.id;
    socioAId = socioA.id;
    socioBId = socioB.id;
  }, 30_000);

  afterAll(async () => {
    await prisma.reserva.deleteMany({ where: { club_id: clubId } });
    await prisma.membresia.deleteMany({ where: { club_id: clubId } });
    await prisma.usuario.deleteMany({
      where: { id: { in: [usuarioAId, usuarioBId] } },
    });
    await prisma.espacio.deleteMany({ where: { club_id: clubId } });
    await prisma.club.delete({ where: { id: clubId } });
    await prisma.$disconnect();
  }, 30_000);

  it('dos altas simultáneas para el mismo horario: exactamente una gana', async () => {
    const inicio = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const fin = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

    const [resA, resB] = await Promise.allSettled([
      service.create(clubId, {
        espacio_id: espacioId,
        socio_id: socioAId,
        inicio,
        fin,
      }),
      service.create(clubId, {
        espacio_id: espacioId,
        socio_id: socioBId,
        inicio,
        fin,
      }),
    ]);

    const fulfilled = [resA, resB].filter((r) => r.status === 'fulfilled');
    const rejected = [resA, resB].filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      BadRequestException,
    );

    const confirmadas = await prisma.reserva.count({
      where: {
        club_id: clubId,
        espacio_id: espacioId,
        estado: 'confirmada',
      },
    });
    expect(confirmadas).toBe(1);
  }, 30_000);
});
