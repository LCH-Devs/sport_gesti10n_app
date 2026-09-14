import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService password recovery', () => {
  const prisma = { usuario: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() } };
  const config = { get: jest.fn((key: string) => key === 'WEB_APP_URL' ? 'http://localhost:3000' : '') };
  const mail = { sendPasswordReset: jest.fn().mockResolvedValue({ sent: false, stub: true }) };
  const auth = new AuthService(prisma as any, {} as any, config as any, {} as any, mail as any);

  beforeEach(() => jest.clearAllMocks());

  it('responde igual aunque el email no exista', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(auth.forgotPassword({ email: 'nadie@test.com' })).resolves.toEqual({ message: expect.any(String) });
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('genera token y envía enlace para email existente', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: 4, email: 'user@test.com' });
    prisma.usuario.update.mockResolvedValue({});
    await auth.forgotPassword({ email: 'USER@test.com' });
    expect(prisma.usuario.update).toHaveBeenCalled();
    expect(mail.sendPasswordReset).toHaveBeenCalledWith(expect.objectContaining({ to: 'user@test.com', resetUrl: expect.stringContaining('token=') }));
  });

  it('rechaza token vencido o reutilizado', async () => {
    prisma.usuario.findFirst.mockResolvedValue(null);
    await expect(auth.resetPassword({ token: 'bad', password: 'nuevaclave' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
