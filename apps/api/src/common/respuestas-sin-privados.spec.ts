import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { SociosService } from '../socios/socios.service';
import { AdminsService } from '../admins/admins.service';
import { FamiliasService } from '../familias/familias.service';
import { PagosService } from '../pagos/pagos.service';
import { PlatformService } from '../platform/platform.service';
import { AuthService } from '../auth/auth.service';
import { LoginAttemptService } from '../auth/login-attempt.service';

/**
 * R05: "tests recursivos de respuestas: ningún hash, secreto o grafo
 * privado". La auditoría manual (selects/flattenPerson consistentes en
 * todo el código) ya dio bien, pero esa disciplina se puede romper con un
 * `include` descuidado en un cambio futuro. Esta suite recorre las
 * respuestas reales de las superficies más expuestas (padrón, familias,
 * cobros, lecturas de plataforma y — la más sensible — el login) contra
 * Postgres real, y falla si aparece cualquier campo de la lista negra en
 * cualquier profundidad del objeto.
 */

const CAMPOS_PROHIBIDOS = [
  'password_hash',
  'reset_token_hash',
  'reset_expires_at',
  'reset_used_at',
  'plan_pendiente_token_hash',
];

function buscarClavesProhibidas(valor: unknown, ruta = '$'): string[] {
  if (valor === null || valor === undefined) return [];
  if (valor instanceof Date) return [];
  if (Array.isArray(valor)) {
    return valor.flatMap((v, i) => buscarClavesProhibidas(v, `${ruta}[${i}]`));
  }
  if (typeof valor !== 'object') return [];

  const hallazgos: string[] = [];
  for (const [key, val] of Object.entries(valor as Record<string, unknown>)) {
    if (CAMPOS_PROHIBIDOS.includes(key)) {
      hallazgos.push(`${ruta}.${key}`);
    }
    hallazgos.push(...buscarClavesProhibidas(val, `${ruta}.${key}`));
  }
  return hallazgos;
}

describe('buscarClavesProhibidas — control del propio detector', () => {
  it('encuentra un campo prohibido sin importar la profundidad', () => {
    expect(
      buscarClavesProhibidas({ a: { b: [{ password_hash: 'x' }] } }),
    ).toEqual(['$.a.b[0].password_hash']);
  });

  it('no reporta falsos positivos en un objeto limpio', () => {
    expect(
      buscarClavesProhibidas({ id: 1, nombre: 'Ana', fecha: new Date() }),
    ).toEqual([]);
  });
});

describe('Ninguna respuesta expone hashes/tokens/secretos (Postgres real)', () => {
  const prisma = new PrismaClient();
  const planStub = { assertCanAddMembers: jest.fn().mockResolvedValue(undefined) } as any;
  const pagosStub = {
    generarLinksDeAlta: jest.fn().mockResolvedValue(undefined),
    persistirAlta: jest.fn().mockResolvedValue(undefined),
  } as any;
  const mercadoPagoStub = {} as any;
  const configStub = { get: () => undefined } as any;

  const socios = new SociosService(prisma as any, planStub, pagosStub);
  const admins = new AdminsService(prisma as any);
  const familias = new FamiliasService(prisma as any, socios, planStub, pagosStub);
  const pagos = new PagosService(prisma as any, mercadoPagoStub);
  const platform = new PlatformService(
    prisma as any,
    {} as any,
    configStub,
    planStub,
  );
  const auth = new AuthService(
    prisma as any,
    new JwtService({ secret: 'test-secret-no-usar-en-prod' }),
    configStub,
    new LoginAttemptService(),
    undefined,
  );

  let clubId: number;
  let usuarioAdminId: number;
  let usuarioSocioId: number;
  let socioId: number;
  let adminId: number;
  let familiaId: number;
  const claveSocio = 'ClavePropia123!';
  const mes = new Date().toISOString().slice(0, 7);

  beforeAll(async () => {
    await prisma.$connect();
    const suffix = Date.now();

    const club = await prisma.club.create({
      data: { slug: `sin-privados-${suffix}`, nombre: 'Club sin privados' },
    });
    clubId = club.id;

    const usuarioAdmin = await prisma.usuario.create({
      data: {
        email: `admin-${suffix}@test.com`,
        password_hash: await bcrypt.hash('ClaveAdmin123!', 10),
        nombre: 'Admin',
        reset_token_hash: 'no-debe-salir-nunca',
      },
    });
    const usuarioSocio = await prisma.usuario.create({
      data: {
        email: `socio-${suffix}@test.com`,
        password_hash: await bcrypt.hash(claveSocio, 10),
        nombre: 'Socio',
        apellido: 'Prueba',
        dni: '30111222',
        reset_token_hash: 'no-debe-salir-nunca',
      },
    });
    usuarioAdminId = usuarioAdmin.id;
    usuarioSocioId = usuarioSocio.id;

    const admin = await prisma.membresia.create({
      data: { usuario_id: usuarioAdmin.id, club_id: clubId, rol: 'admin' },
    });
    const socio = await prisma.membresia.create({
      data: { usuario_id: usuarioSocio.id, club_id: clubId, rol: 'socio' },
    });
    adminId = admin.id;
    socioId = socio.id;

    const familia = await prisma.grupoFamiliar.create({
      data: { club_id: clubId, nombre: 'Familia prueba', titular_id: socio.id },
    });
    familiaId = familia.id;

    await prisma.pago.create({
      data: { club_id: clubId, socio_id: socio.id, mes, monto: 1000, estado: 'pendiente' },
    });

    // También queda un token de "olvidé mi contraseña" activo en la fila:
    // el reset de verdad se prueba en password-recovery.spec.ts; acá solo
    // nos importa que ese hash jamás salga en ninguna lectura normal.
  }, 30_000);

  afterAll(async () => {
    await prisma.pago.deleteMany({ where: { club_id: clubId } });
    await prisma.grupoFamiliar.deleteMany({ where: { club_id: clubId } });
    await prisma.membresia.deleteMany({ where: { club_id: clubId } });
    await prisma.usuario.deleteMany({
      where: { id: { in: [usuarioAdminId, usuarioSocioId] } },
    });
    await prisma.club.delete({ where: { id: clubId } });
    await prisma.$disconnect();
  }, 30_000);

  it('SociosService.list / getOne', async () => {
    const lista = await socios.list(clubId);
    expect(buscarClavesProhibidas(lista)).toEqual([]);

    const uno = await socios.getOne(clubId, socioId);
    expect(buscarClavesProhibidas(uno)).toEqual([]);
  });

  it('AdminsService.list', async () => {
    const lista = await admins.list(clubId);
    expect(buscarClavesProhibidas(lista)).toEqual([]);
  });

  it('FamiliasService.list / getOne', async () => {
    const lista = await familias.list(clubId);
    expect(buscarClavesProhibidas(lista)).toEqual([]);

    const una = await familias.getOne(clubId, familiaId);
    expect(buscarClavesProhibidas(una)).toEqual([]);
  });

  it('PagosService.resumen', async () => {
    const resumen = await pagos.resumen(clubId, mes);
    expect(buscarClavesProhibidas(resumen)).toEqual([]);
  });

  it('PlatformService.getClubResource — socios, usuarios, familias, cobros', async () => {
    for (const recurso of ['socios', 'usuarios', 'familias', 'cobros'] as const) {
      const data = await platform.getClubResource(clubId, recurso);
      expect(buscarClavesProhibidas(data)).toEqual([]);
    }
  });

  it('AuthService.login — la respuesta más expuesta de todas (admin y socio)', async () => {
    const usuarioAdmin = await prisma.usuario.findUnique({
      where: { id: usuarioAdminId },
    });
    const resAdmin = await auth.login({
      email: usuarioAdmin!.email,
      password: 'ClaveAdmin123!',
      club_slug: undefined,
    } as any);
    expect(buscarClavesProhibidas(resAdmin)).toEqual([]);

    const usuarioSocio = await prisma.usuario.findUnique({
      where: { id: usuarioSocioId },
    });
    const resSocio = await auth.login({
      email: usuarioSocio!.email,
      password: claveSocio,
      club_slug: undefined,
    } as any);
    expect(buscarClavesProhibidas(resSocio)).toEqual([]);
  });
});
