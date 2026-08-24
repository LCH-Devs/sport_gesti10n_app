import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export type ClubWelcomeMail = {
  to: string;
  clubNombre: string;
  slug: string;
  email: string;
  password: string;
  loginUrl: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendClubWelcome(payload: ClubWelcomeMail) {
    const subject = `Acceso a ${payload.clubNombre} — ClubApp`;
    const body = this.buildWelcomeBody(payload);
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        `SMTP no configurado. Mail stub a ${payload.to}. Completá SMTP_HOST/USER/PASS en .env`,
      );
      this.logger.log(body);
      return {
        sent: false,
        stub: true,
        to: payload.to,
        subject,
        body,
        login_url: payload.loginUrl,
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
        to: payload.to,
        subject,
        text: body,
        html: this.buildWelcomeHtml(payload),
      });

      this.logger.log(`Mail enviado a ${payload.to}`);
      return {
        sent: true,
        stub: false,
        to: payload.to,
        subject,
        body,
        login_url: payload.loginUrl,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error SMTP';
      this.logger.error(`Falló el envío a ${payload.to}: ${message}`);
      return {
        sent: false,
        stub: true,
        to: payload.to,
        subject,
        body,
        login_url: payload.loginUrl,
        error: message,
      };
    }
  }

  buildWelcomeBody(payload: ClubWelcomeMail) {
    return [
      `Hola,`,
      ``,
      `Te creamos el acceso al panel de ${payload.clubNombre}.`,
      ``,
      `Link: ${payload.loginUrl}`,
      `Usuario: ${payload.email}`,
      `Contraseña temporal: ${payload.password}`,
      ``,
      `En el primer ingreso vas a completar los datos del club y elegir una contraseña nueva.`,
      ``,
      `— ClubApp Arg`,
    ].join('\n');
  }

  private buildWelcomeHtml(payload: ClubWelcomeMail) {
    return `
      <p>Hola,</p>
      <p>Te creamos el acceso al panel de <strong>${payload.clubNombre}</strong>.</p>
      <p>
        <a href="${payload.loginUrl}">${payload.loginUrl}</a><br/>
        Usuario: <strong>${payload.email}</strong><br/>
        Contraseña temporal: <strong>${payload.password}</strong>
      </p>
      <p>En el primer ingreso vas a completar los datos del club y elegir una contraseña nueva.</p>
      <p>— ClubApp Arg</p>
    `;
  }
}

