import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SociosController } from '../socios/socios.controller';
import { SociosService } from '../socios/socios.service';

const JWT_SECRET = 'tenant-isolation-test-secret';

describe('Aislamiento multi-tenant (Club A vs Club B)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let socios: {
    list: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };

  beforeAll(async () => {
    socios = {
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ id: 10 }),
      create: jest.fn().mockResolvedValue({ id: 11 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET })],
        }),
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET }),
      ],
      controllers: [SociosController],
      providers: [
        JwtStrategy,
        { provide: SociosService, useValue: socios },
      ],
    }).compile();

    app = module.createNestApplication();
    jwt = module.get(JwtService);
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function tokenClub(club_id: number, club_slug: string) {
    return jwt.sign({
      sub: club_id * 10,
      role: 'admin',
      club_id,
      club_slug,
    });
  }

  it('lista socios con el club_id del JWT, no del header', async () => {
    const token = tokenClub(1, 'club-a');
    await request(app.getHttpServer())
      .get('/socios')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Club-Slug', 'club-a')
      .expect(200);

    expect(socios.list).toHaveBeenCalledWith(1);
  });

  it('Club A no puede usar el slug de Club B', async () => {
    const token = tokenClub(1, 'club-a');
    await request(app.getHttpServer())
      .get('/socios')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Club-Slug', 'club-b')
      .expect(403);

    expect(socios.list).not.toHaveBeenCalled();
  });

  it('al actualizar, usa el club del JWT aunque el recurso sea de otro club', async () => {
    const token = tokenClub(1, 'club-a');
    socios.update.mockResolvedValueOnce({ id: 99 });

    await request(app.getHttpServer())
      .patch('/socios/99')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Hack' })
      .expect(200);

    expect(socios.update).toHaveBeenCalledWith(1, 99, expect.any(Object));
  });

  it('token de plataforma no entra a endpoints del club', async () => {
    const token = jwt.sign({ sub: 1, role: 'platform' });
    await request(app.getHttpServer())
      .get('/socios')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Club-Slug', 'club-a')
      .expect(403);

    expect(socios.list).not.toHaveBeenCalled();
  });

  it('token de socio no lista el padrón de la comisión', async () => {
    const token = jwt.sign({
      sub: 9,
      role: 'socio',
      club_id: 1,
      club_slug: 'club-a',
    });
    await request(app.getHttpServer())
      .get('/socios')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(socios.list).not.toHaveBeenCalled();
  });
});
