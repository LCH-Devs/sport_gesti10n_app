import 'dotenv/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SociosService } from '../socios/socios.service';
import { FamiliasService } from '../familias/familias.service';
import { ReservasService } from '../reservas/reservas.service';
import { ActividadesService } from '../actividades/actividades.service';
import { PagosService } from '../pagos/pagos.service';

/**
 * R09: `tenant-isolation.spec.ts` prueba el enrutamiento HTTP (guards, JWT)
 * con Prisma completamente mockeado — útil, pero no demuestra que un club
 * realmente no pueda leer/escribir filas de otro en Postgres. Este archivo
 * sí pega contra el Postgres real de desarrollo y prueba, con datos
 * concretos de dos clubes, los recursos que pide el roadmap: socios,
 * familias, reservas, actividades, pagos y la identidad compartida entre
 * clubes (R07).
 *
 * Los servicios se instancian directamente (como en
 * reservas-concurrencia.spec.ts) con el PrismaService real; los
 * colaboradores que no participan de las consultas por club_id bajo
 * prueba (plan SaaS, alta de cobros, MercadoPago) se stubean para no
 * arrastrar Mail/HTTP externos innecesarios.
 */
describe('Aislamiento multi-tenant — Postgres real (Club A vs Club B)', () => {
  const prisma = new PrismaClient();
  const planStub = {
    assertCanAddMembers: jest.fn().mockResolvedValue(undefined),
  } as any;
  const pagosStub = {
    generarLinksDeAlta: jest.fn().mockResolvedValue(undefined),
    persistirAlta: jest.fn().mockResolvedValue(undefined),
  } as any;
  const mercadoPagoStub = {} as any;

  const socios = new SociosService(prisma as any, planStub, pagosStub);
  const familias = new FamiliasService(prisma as any, socios, planStub, pagosStub);
  const reservas = new ReservasService(prisma as any);
  const actividades = new ActividadesService(prisma as any);
  const pagos = new PagosService(prisma as any, mercadoPagoStub);

  let clubA: { id: number };
  let clubB: { id: number };
  let socioA: { id: number };
  let socioB: { id: number };
  let familiaA: { id: number };
  let espacioA: { id: number };
  let reservaA: { id: number };
  let actividadA: { id: number };
  let pagoA: { id: number };
  const mes = new Date().toISOString().slice(0, 7);

  // Identidad compartida: la misma persona (mismo Usuario) es socia activa
  // en ambos clubes — el caso que R07 tiene que proteger.
  let usuarioCompartido: { id: number };
  let sharedMembresiaA: { id: number };

  const idsUsuario: number[] = [];
  const idsClub: number[] = [];

  beforeAll(async () => {
    await prisma.$connect();
    const suffix = Date.now();

    clubA = await prisma.club.create({
      data: { slug: `tenant-a-${suffix}`, nombre: 'Club A test', max_reservas_activas: 10 },
    });
    clubB = await prisma.club.create({
      data: { slug: `tenant-b-${suffix}`, nombre: 'Club B test', max_reservas_activas: 10 },
    });
    idsClub.push(clubA.id, clubB.id);

    const usuarioA = await prisma.usuario.create({
      data: { email: `a-${suffix}@test.com`, password_hash: 'x', nombre: 'Socio', apellido: 'A' },
    });
    const usuarioB = await prisma.usuario.create({
      data: { email: `b-${suffix}@test.com`, password_hash: 'x', nombre: 'Socio', apellido: 'B' },
    });
    usuarioCompartido = await prisma.usuario.create({
      data: {
        email: `compartido-${suffix}@test.com`,
        password_hash: 'x',
        nombre: 'Compartido',
        apellido: 'Entre clubes',
      },
    });
    idsUsuario.push(usuarioA.id, usuarioB.id, usuarioCompartido.id);

    socioA = await prisma.membresia.create({
      data: { usuario_id: usuarioA.id, club_id: clubA.id, rol: 'socio' },
    });
    socioB = await prisma.membresia.create({
      data: { usuario_id: usuarioB.id, club_id: clubB.id, rol: 'socio' },
    });
    sharedMembresiaA = await prisma.membresia.create({
      data: { usuario_id: usuarioCompartido.id, club_id: clubA.id, rol: 'socio' },
    });
    // La misma persona, también activa en el Club B.
    await prisma.membresia.create({
      data: { usuario_id: usuarioCompartido.id, club_id: clubB.id, rol: 'socio' },
    });

    familiaA = await prisma.grupoFamiliar.create({
      data: { club_id: clubA.id, nombre: 'Familia A', titular_id: socioA.id },
    });
    await prisma.grupoFamiliar.create({
      data: { club_id: clubB.id, nombre: 'Familia B', titular_id: socioB.id },
    });

    espacioA = await prisma.espacio.create({
      data: { club_id: clubA.id, nombre: 'Cancha A', tipo: 'cancha' },
    });
    const espacioB = await prisma.espacio.create({
      data: { club_id: clubB.id, nombre: 'Cancha B', tipo: 'cancha' },
    });
    reservaA = await prisma.reserva.create({
      data: {
        club_id: clubA.id,
        espacio_id: espacioA.id,
        socio_id: socioA.id,
        inicio: new Date(Date.now() + 48 * 3600 * 1000),
        fin: new Date(Date.now() + 49 * 3600 * 1000),
        estado: 'confirmada',
      },
    });
    await prisma.reserva.create({
      data: {
        club_id: clubB.id,
        espacio_id: espacioB.id,
        socio_id: socioB.id,
        inicio: new Date(Date.now() + 48 * 3600 * 1000),
        fin: new Date(Date.now() + 49 * 3600 * 1000),
        estado: 'confirmada',
      },
    });

    actividadA = await prisma.actividad.create({
      data: { club_id: clubA.id, nombre: 'Actividad A' },
    });
    await prisma.actividad.create({ data: { club_id: clubB.id, nombre: 'Actividad B' } });

    pagoA = await prisma.pago.create({
      data: { club_id: clubA.id, socio_id: socioA.id, mes, monto: 1000, estado: 'pendiente' },
    });
    await prisma.pago.create({
      data: { club_id: clubB.id, socio_id: socioB.id, mes, monto: 1000, estado: 'pendiente' },
    });
  }, 30_000);

  afterAll(async () => {
    for (const clubId of idsClub) {
      await prisma.pago.deleteMany({ where: { club_id: clubId } });
      await prisma.reserva.deleteMany({ where: { club_id: clubId } });
      await prisma.espacio.deleteMany({ where: { club_id: clubId } });
      await prisma.actividad.deleteMany({ where: { club_id: clubId } });
    }
    await prisma.grupoFamiliar.deleteMany({ where: { club_id: { in: idsClub } } });
    await prisma.membresia.deleteMany({ where: { club_id: { in: idsClub } } });
    await prisma.usuario.deleteMany({ where: { id: { in: idsUsuario } } });
    await prisma.club.deleteMany({ where: { id: { in: idsClub } } });
    await prisma.$disconnect();
  }, 30_000);

  it('Socios: Club B no puede leer ni editar un socio del Club A', async () => {
    await expect(socios.getOne(clubB.id, socioA.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      socios.update(clubB.id, socioA.id, { nombre: 'Hackeado' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    // Control positivo: el propio club sí puede.
    await expect(socios.getOne(clubA.id, socioA.id)).resolves.toBeDefined();
  });

  it('Familias: Club B no puede leer ni editar una familia del Club A', async () => {
    await expect(familias.getOne(clubB.id, familiaA.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      familias.update(clubB.id, familiaA.id, { nombre: 'Hackeada' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(familias.getOne(clubA.id, familiaA.id)).resolves.toBeDefined();
  });

  it('Reservas: Club B no puede cancelar una reserva del Club A', async () => {
    await expect(reservas.cancelar(clubB.id, reservaA.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const listaB = await reservas.list(clubB.id, {});
    expect(listaB.some((r) => r.id === reservaA.id)).toBe(false);
  });

  it('Actividades: Club B no puede editar una actividad del Club A', async () => {
    await expect(
      actividades.update(clubB.id, actividadA.id, { nombre: 'Hackeada' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    const listaB = await actividades.list(clubB.id);
    expect(listaB.some((a) => a.id === actividadA.id)).toBe(false);
  });

  it('Pagos: el resumen de Club B no incluye cuotas del Club A', async () => {
    const resumenB = await pagos.resumen(clubB.id, mes);
    const resumenA = await pagos.resumen(clubA.id, mes);

    expect(resumenB.pagos.some((p: { id: number }) => p.id === pagoA.id)).toBe(
      false,
    );
    expect(resumenA.pagos.some((p: { id: number }) => p.id === pagoA.id)).toBe(
      true,
    );
  });

  it('Identidad compartida: Club A no puede pisar los datos de alguien activo también en Club B', async () => {
    await expect(
      socios.update(clubA.id, sharedMembresiaA.id, { telefono: '1111111111' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Cambiar solo el estado (no es un dato compartido) sí debe andar.
    await expect(
      socios.update(clubA.id, sharedMembresiaA.id, { estado: 'moroso' }),
    ).resolves.toBeDefined();
  });
});
