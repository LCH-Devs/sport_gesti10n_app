import {
  buildClubDeletedText,
  buildClubReactivatedText,
  buildClubSuspendedText,
  buildClubWelcomeText,
} from './mail.service';

const welcome = {
  to: 'admin@club.com',
  clubNombre: 'Prueba',
  email: 'admin@club.com',
  password: 'TmpPass1!',
  loginUrl: 'http://localhost:3000/login',
};

describe('mails de club', () => {
  it('alta: incluye pass temporal y login sin slug', () => {
    const body = buildClubWelcomeText(welcome);
    expect(body).toContain('http://localhost:3000/login');
    expect(body).not.toContain('.localhost');
    expect(body).toContain('TmpPass1!');
    expect(body).not.toContain('tu contraseña actual');
    expect(body).toContain('completar los datos del club');
  });

  it('suspensión: no incluye contraseña', () => {
    const body = buildClubSuspendedText({
      to: welcome.to,
      clubNombre: welcome.clubNombre,
    });
    expect(body).toContain('suspendido');
    expect(body).not.toContain('Contraseña');
  });

  it('baja: avisa que la cuenta fue eliminada y no incluye pass', () => {
    const body = buildClubDeletedText({
      to: welcome.to,
      clubNombre: welcome.clubNombre,
    });
    expect(body).toContain('eliminada');
    expect(body).not.toContain('Contraseña');
    expect(body).toContain('correo quedó libre');
  });

  it('reactivación: pass nueva y no pide onboarding', () => {
    const body = buildClubReactivatedText(welcome);
    expect(body).toContain('TmpPass1!');
    expect(body).toContain('http://localhost:3000/login');
    expect(body).toContain('configuración del club');
    expect(body).not.toContain('CUIT');
  });
});
