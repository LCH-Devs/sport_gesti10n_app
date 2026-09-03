import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  TRIAL_AVISO_MS,
  TRIAL_MS,
  debeAvisarTrial10d,
} from './solicitudes.constants';

const row = {
  id: 1,
  nombre: 'Ana',
  apellido: 'Pérez',
  nombre_club: 'Club Sur',
  email: 'ana@club.com',
  telefono: '1144556677',
  cantidad_miembros: 8,
  cantidad_socios: 120,
  eliminado: false,
  estado: 'pendiente',
  created_at: new Date('2026-09-01'),
  updated_at: new Date('2026-09-01'),
};

const dto = {
  nombre: ' Ana ',
  apellido: ' Pérez ',
  nombre_club: ' Club Sur ',
  email: 'Ana@Club.com',
  telefono: '1144556677',
  cantidad_miembros: 8,
};

describe('SolicitudesService', () => {
  const prisma = {
    solicitud: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };
  const mail = { sendTrialQuedan10d: jest.fn() };
  let service: SolicitudesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SolicitudesService(
      prisma as unknown as PrismaService,
      mail as unknown as MailService,
    );
  });

  it('alta siempre pendiente y completa fecha_solicitud', async () => {
    prisma.solicitud.create.mockResolvedValue({ id: 1, estado: 'pendiente' });
    prisma.$executeRaw.mockResolvedValue(1);
    const created = await service.create(dto);
    expect(created.id).toBe(1);
    expect(created.estado).toBe('pendiente');
    expect(created.fecha_solicitud).toEqual(expect.any(Date));
    expect(prisma.solicitud.create).toHaveBeenCalledWith({
      data: {
        nombre: 'Ana',
        apellido: 'Pérez',
        nombre_club: 'Club Sur',
        email: 'ana@club.com',
        telefono: '1144556677',
        cantidad_miembros: 8,
        cantidad_socios: 0,
        estado: 'pendiente',
      },
      select: { id: true, estado: true },
    });
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('countPendientes solo pendientes no eliminadas', async () => {
    prisma.solicitud.count.mockResolvedValue(4);
    await expect(service.countPendientes()).resolves.toEqual({ count: 4 });
    expect(prisma.solicitud.count).toHaveBeenCalledWith({
      where: { estado: 'pendiente', eliminado: false },
    });
  });

  it('list filtra eliminado y opcionalmente estado', async () => {
    prisma.solicitud.findMany.mockResolvedValue([row]);
    await service.list('pendiente');
    expect(prisma.solicitud.findMany).toHaveBeenCalledWith({
      where: { eliminado: false, estado: 'pendiente' },
      orderBy: { created_at: 'desc' },
    });
  });

  it('update a trial cambia estado', async () => {
    prisma.solicitud.findFirst.mockResolvedValue(row);
    prisma.solicitud.update.mockResolvedValue({ ...row, estado: 'trial' });
    await service.update(1, { estado: 'trial' });
    expect(prisma.solicitud.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { estado: 'trial', fecha_trial: expect.any(Date) },
    });
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('update a aprobada y cancelada stamp fecha', async () => {
    prisma.solicitud.findFirst.mockResolvedValue(row);
    prisma.solicitud.update.mockResolvedValue({ ...row, estado: 'aprobada' });
    await service.update(1, { estado: 'aprobada' });
    expect(prisma.solicitud.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { estado: 'aprobada', fecha_aprobada: expect.any(Date) },
    });

    prisma.solicitud.findFirst.mockResolvedValue(row);
    await service.update(1, { estado: 'cancelada' });
    expect(prisma.solicitud.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { estado: 'cancelada', fecha_cancelada: expect.any(Date) },
    });
  });

  it('update a borradas marca eliminado', async () => {
    prisma.solicitud.findFirst.mockResolvedValue(row);
    prisma.solicitud.update.mockResolvedValue({
      ...row,
      estado: 'borradas',
      eliminado: true,
    });
    await service.update(1, { estado: 'borradas' });
    expect(prisma.solicitud.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        estado: 'borradas',
        eliminado: true,
        fecha_eliminada: expect.any(Date),
      },
    });
  });

  it('update sin estado 400', async () => {
    await expect(service.update(1, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.solicitud.update).not.toHaveBeenCalled();
  });

  it('update de una eliminada 404', async () => {
    prisma.solicitud.findFirst.mockResolvedValue(null);
    await expect(service.update(9, { estado: 'trial' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('aviso 10d solo dentro de la ventana', () => {
    const now = new Date('2026-09-30T12:00:00Z');
    expect(debeAvisarTrial10d(new Date(now.getTime() - 20 * 86400000), now)).toBe(
      true,
    );
    expect(debeAvisarTrial10d(new Date(now.getTime() - 5 * 86400000), now)).toBe(
      false,
    );
    expect(
      debeAvisarTrial10d(new Date(now.getTime() - TRIAL_MS - 1000), now),
    ).toBe(false);
    expect(TRIAL_AVISO_MS).toBe(10 * 86400000);
  });

  it('avisarTrialsPorVencer manda mail una vez', async () => {
    const now = new Date();
    const fechaTrial = new Date(now.getTime() - 20 * 86400000);
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 1,
        email: 'ana@club.com',
        nombre: 'Ana',
        nombre_club: 'Club Sur',
        fecha_trial: fechaTrial,
      },
    ]);
    mail.sendTrialQuedan10d.mockResolvedValue({ sent: true });
    prisma.$executeRaw.mockResolvedValue(1);
    const result = await service.avisarTrialsPorVencer(now);
    expect(result.enviados).toBe(1);
    expect(mail.sendTrialQuedan10d).toHaveBeenCalledWith({
      to: 'ana@club.com',
      nombre: 'Ana',
      clubNombre: 'Club Sur',
    });
  });
});
