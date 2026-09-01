import { ForbiddenException } from '@nestjs/common';
import { SocialService } from './social.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/jwt.strategy';

const club = {
  id: 1,
  nombre: 'Club Prueba',
  slug: 'club-prueba',
  logo_url: null,
  activo: true,
  eliminado: false,
};

const post = {
  id: 10,
  club_id: 1,
  autor_tipo: 'admin',
  autor_id: 5,
  titulo: 'Copa abierta',
  cuerpo: 'Inscripciones',
  imagen_url: null,
  fecha_evento: null,
  lugar: null,
  visible: true,
  eliminado: false,
  created_at: new Date('2026-09-01'),
  updated_at: new Date('2026-09-01'),
  club,
};

function adminJwt(club_id = 1): JwtPayload {
  return { sub: 5, role: 'admin', club_id, club_slug: 'club-prueba', user_id: 3 };
}

describe('SocialService', () => {
  const prisma = {
    publicacionSocial: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    club: { findFirst: jest.fn() },
  };
  let social: SocialService;

  beforeEach(() => {
    jest.clearAllMocks();
    social = new SocialService(prisma as unknown as PrismaService);
  });

  it('socio no puede publicar', async () => {
    await expect(
      social.create({ sub: 9, role: 'socio', club_id: 1 }, {
        titulo: 'Hola',
        cuerpo: 'Texto',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.publicacionSocial.create).not.toHaveBeenCalled();
  });

  it('entrada no puede publicar', async () => {
    await expect(
      social.create({ sub: 8, role: 'entrada', club_id: 1 }, {
        titulo: 'Hola',
        cuerpo: 'Texto',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin publica con el club_id del JWT, ignora club_id del body', async () => {
    prisma.club.findFirst.mockResolvedValue({ id: 1 });
    prisma.publicacionSocial.create.mockResolvedValue(post);
    await social.create(adminJwt(), {
      titulo: 'Copa',
      cuerpo: 'Venite',
      club_id: 99,
    });
    expect(prisma.publicacionSocial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          club_id: 1,
          autor_tipo: 'admin',
          autor_id: 5,
        }),
      }),
    );
  });

  it('platform puede publicar sin club (ClubApp)', async () => {
    prisma.publicacionSocial.create.mockResolvedValue({
      ...post,
      club_id: null,
      club: null,
      autor_tipo: 'platform',
      autor_id: 1,
    });
    await social.create({ sub: 1, role: 'platform' }, {
      titulo: 'Novedad',
      cuerpo: 'De la plataforma',
    });
    expect(prisma.club.findFirst).not.toHaveBeenCalled();
    expect(prisma.publicacionSocial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          club_id: null,
          autor_tipo: 'platform',
        }),
      }),
    );
  });

  it('admin no edita un post de otro club', async () => {
    prisma.publicacionSocial.findFirst.mockResolvedValue(post);
    await expect(
      social.update(adminJwt(2), 10, { titulo: 'Hack' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.publicacionSocial.update).not.toHaveBeenCalled();
  });
});
