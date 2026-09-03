import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export type ClubWelcomeMail = {
  to: string;
  clubNombre: string;
  email: string;
  password: string;
  loginUrl: string;
};

export type ClubStatusMail = {
  to: string;
  clubNombre: string;
};

export type ClubReactivatedMail = ClubWelcomeMail;

export type Trial10dMail = {
  to: string;
  nombre: string;
  clubNombre: string;
};

export type MailResult = {
  sent: boolean;
  stub: boolean;
  to: string;
  subject: string;
  body: string;
  login_url?: string;
  error?: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapHtml(title: string, inner: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#1d4ed8;padding:20px 28px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">ClubApp</p>
              <p style="margin:4px 0 0;font-size:13px;color:#dbeafe;">Gestión de clubes</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-size:12px;color:#64748b;line-height:1.5;">
              Este correo lo envía ClubApp. Si no esperabas este mensaje, podés ignorarlo.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildClubWelcomeText(p: ClubWelcomeMail) {
  return [
    `Hola,`,
    ``,
    `Tu club ${p.clubNombre} ya está dado de alta en ClubApp.`,
    ``,
    `Panel de gestión:`,
    p.loginUrl,
    ``,
    `Usuario: ${p.email}`,
    `Contraseña temporal: ${p.password}`,
    ``,
    `En el primer ingreso vas a completar los datos del club (titular, CUIT/CUIL y branding) y a elegir una contraseña nueva.`,
    ``,
    `Por seguridad, no reenvíes este correo. La contraseña temporal vence cuando la cambies.`,
    ``,
    `— Equipo ClubApp`,
  ].join('\n');
}

export function buildClubWelcomeHtml(p: ClubWelcomeMail) {
  const club = escapeHtml(p.clubNombre);
  const email = escapeHtml(p.email);
  const password = escapeHtml(p.password);
  const url = escapeHtml(p.loginUrl);
  return wrapHtml(
    `Acceso a ${p.clubNombre}`,
    `
      <p style="margin:0 0 12px;font-size:16px;">Hola,</p>
      <p style="margin:0 0 16px;line-height:1.55;">Tu club <strong>${club}</strong> ya está dado de alta en ClubApp.</p>
      <p style="margin:0 0 8px;"><a href="${url}" style="color:#1d4ed8;">${url}</a></p>
      <p style="margin:0 0 4px;">Usuario: <strong>${email}</strong></p>
      <p style="margin:0 0 16px;">Contraseña temporal: <strong>${password}</strong></p>
      <p style="margin:0;line-height:1.55;">En el primer ingreso vas a completar los datos del club (titular, CUIT/CUIL y branding) y a elegir una contraseña nueva.</p>
    `,
  );
}

export function buildClubSuspendedText(p: ClubStatusMail) {
  return [
    `Hola,`,
    ``,
    `Te informamos que el acceso al panel de ${p.clubNombre} fue suspendido.`,
    ``,
    `Mientras tanto no vas a poder ingresar. Los datos del club se conservan.`,
    `Cuando se rehabilite la cuenta te avisamos por este mismo correo, con una contraseña nueva para volver a entrar.`,
    ``,
    `— Equipo ClubApp`,
  ].join('\n');
}

export function buildClubSuspendedHtml(p: ClubStatusMail) {
  const club = escapeHtml(p.clubNombre);
  return wrapHtml(
    `${p.clubNombre} suspendido`,
    `
      <p style="margin:0 0 12px;font-size:16px;">Hola,</p>
      <p style="margin:0 0 16px;line-height:1.55;">El acceso al panel de <strong>${club}</strong> fue <strong>suspendido</strong>.</p>
      <p style="margin:0;line-height:1.55;">Mientras tanto no vas a poder ingresar. Los datos del club se conservan. Cuando se rehabilite la cuenta te avisamos por este mismo correo, con una contraseña nueva.</p>
    `,
  );
}

export function buildClubReactivatedText(p: ClubReactivatedMail) {
  return [
    `Hola,`,
    ``,
    `El acceso al panel de ${p.clubNombre} ya está habilitado de nuevo.`,
    ``,
    `Panel de gestión:`,
    p.loginUrl,
    ``,
    `Usuario: ${p.email}`,
    `Contraseña temporal: ${p.password}`,
    ``,
    `Al ingresar te vamos a pedir que elijas una contraseña nueva. El resto de la configuración del club (socios, branding, cuotas) se mantiene como estaba.`,
    ``,
    `— Equipo ClubApp`,
  ].join('\n');
}

export function buildClubReactivatedHtml(p: ClubReactivatedMail) {
  const club = escapeHtml(p.clubNombre);
  const email = escapeHtml(p.email);
  const password = escapeHtml(p.password);
  const url = escapeHtml(p.loginUrl);
  return wrapHtml(
    `${p.clubNombre} rehabilitado`,
    `
      <p style="margin:0 0 12px;font-size:16px;">Hola,</p>
      <p style="margin:0 0 16px;line-height:1.55;">El acceso al panel de <strong>${club}</strong> ya está <strong>habilitado</strong> de nuevo.</p>
      <p style="margin:0 0 8px;"><a href="${url}" style="color:#1d4ed8;">${url}</a></p>
      <p style="margin:0 0 4px;">Usuario: <strong>${email}</strong></p>
      <p style="margin:0 0 16px;">Contraseña temporal: <strong>${password}</strong></p>
      <p style="margin:0;line-height:1.55;">Al ingresar te vamos a pedir que elijas una contraseña nueva. El resto de la configuración del club se mantiene como estaba.</p>
    `,
  );
}

export function buildClubDeletedText(p: ClubStatusMail) {
  return [
    `Hola,`,
    ``,
    `Te informamos que la cuenta de ${p.clubNombre} en ClubApp fue eliminada.`,
    ``,
    `Ya no vas a poder ingresar al panel con ese club. El correo quedó libre: si más adelante te dan de alta de nuevo, va a ser una cuenta nueva (onboarding y contraseña temporal).`,
    ``,
    `— Equipo ClubApp`,
  ].join('\n');
}

export function buildClubDeletedHtml(p: ClubStatusMail) {
  const club = escapeHtml(p.clubNombre);
  return wrapHtml(
    `${p.clubNombre} eliminado`,
    `
      <p style="margin:0 0 12px;font-size:16px;">Hola,</p>
      <p style="margin:0 0 16px;line-height:1.55;">La cuenta de <strong>${club}</strong> en ClubApp fue <strong>eliminada</strong>.</p>
      <p style="margin:0;line-height:1.55;">Ya no vas a poder ingresar al panel con ese club. El correo quedó libre: si más adelante te dan de alta de nuevo, va a ser una cuenta nueva.</p>
    `,
  );
}

export function buildTrial10dText(p: Trial10dMail) {
  return [
    `Hola ${p.nombre},`,
    ``,
    `Tu periodo de prueba de ClubApp para ${p.clubNombre} vence en 10 días.`,
    ``,
    `Cuando termine la prueba, el servicio pasa a ser pago. Si querés seguir usando ClubApp, coordiná la contratación con nosotros.`,
    ``,
    `— Equipo ClubApp`,
  ].join('\n');
}

export function buildTrial10dHtml(p: Trial10dMail) {
  const club = escapeHtml(p.clubNombre);
  const nombre = escapeHtml(p.nombre);
  return wrapHtml(
    `Quedan 10 días de prueba — ${p.clubNombre}`,
    `
      <p style="margin:0 0 12px;font-size:16px;">Hola ${nombre},</p>
      <p style="margin:0 0 16px;line-height:1.55;">Tu periodo de prueba de ClubApp para <strong>${club}</strong> vence en <strong>10 días</strong>.</p>
      <p style="margin:0;line-height:1.55;">Cuando termine la prueba, el servicio pasa a ser pago. Si querés seguir usando ClubApp, coordiná la contratación con nosotros.</p>
    `,
  );
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  sendClubWelcome(payload: ClubWelcomeMail) {
    return this.deliver({
      to: payload.to,
      subject: `Bienvenida a ClubApp — acceso al panel de ${payload.clubNombre}`,
      text: buildClubWelcomeText(payload),
      html: buildClubWelcomeHtml(payload),
      loginUrl: payload.loginUrl,
    });
  }

  sendClubSuspended(payload: ClubStatusMail) {
    return this.deliver({
      to: payload.to,
      subject: `Tu club ${payload.clubNombre} fue suspendido — ClubApp`,
      text: buildClubSuspendedText(payload),
      html: buildClubSuspendedHtml(payload),
    });
  }

  sendClubDeleted(payload: ClubStatusMail) {
    return this.deliver({
      to: payload.to,
      subject: `Tu club ${payload.clubNombre} fue eliminado — ClubApp`,
      text: buildClubDeletedText(payload),
      html: buildClubDeletedHtml(payload),
    });
  }

  sendClubReactivated(payload: ClubReactivatedMail) {
    return this.deliver({
      to: payload.to,
      subject: `Tu club ${payload.clubNombre} fue rehabilitado — ClubApp`,
      text: buildClubReactivatedText(payload),
      html: buildClubReactivatedHtml(payload),
      loginUrl: payload.loginUrl,
    });
  }

  sendTrialQuedan10d(payload: Trial10dMail) {
    return this.deliver({
      to: payload.to,
      subject: `Quedan 10 días de prueba de ClubApp — ${payload.clubNombre}`,
      text: buildTrial10dText(payload),
      html: buildTrial10dHtml(payload),
    });
  }

  private async deliver(opts: {
    to: string;
    subject: string;
    text: string;
    html: string;
    loginUrl?: string;
  }): Promise<MailResult> {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        `SMTP no configurado. Mail stub a ${opts.to}. Completá SMTP_HOST/USER/PASS en .env`,
      );
      this.logger.log(opts.text);
      return {
        sent: false,
        stub: true,
        to: opts.to,
        subject: opts.subject,
        body: opts.text,
        login_url: opts.loginUrl,
        error: 'SMTP no configurado',
      };
    }

    try {
      const port = Number(this.config.get('SMTP_PORT') || 587);
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      const from =
        this.config.get<string>('SMTP_FROM') || `"ClubApp Arg" <${user}>`;

      await transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });

      this.logger.log(`Mail enviado a ${opts.to} (${opts.subject})`);
      return {
        sent: true,
        stub: false,
        to: opts.to,
        subject: opts.subject,
        body: opts.text,
        login_url: opts.loginUrl,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error SMTP';
      this.logger.error(`Falló el envío a ${opts.to}: ${message}`);
      return {
        sent: false,
        stub: true,
        to: opts.to,
        subject: opts.subject,
        body: opts.text,
        login_url: opts.loginUrl,
        error: message,
      };
    }
  }
}
