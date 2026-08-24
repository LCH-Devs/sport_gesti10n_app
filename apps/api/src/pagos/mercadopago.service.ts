import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

/**
 * Crea preferences de Checkout Pro.
 * Si no hay MP_ACCESS_TOKEN, genera link mock para desarrollo local.
 * La plata siempre es del club (token del club en prod; .env solo sandbox/demo).
 */
@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(private readonly config: ConfigService) {}

  private getAccessToken(): string | null {
    return this.config.get<string>('MP_ACCESS_TOKEN') || null;
  }

  async crearPreference(params: {
    pagoId: number;
    titulo: string;
    monto: number;
    payerEmail?: string;
  }): Promise<{ preferenceId: string; initPoint: string }> {
    const token = this.getAccessToken();
    if (!token) {
      this.logger.warn(
        'MP_ACCESS_TOKEN no configurado: usando link mock de desarrollo',
      );
      return {
        preferenceId: `mock-pref-${params.pagoId}`,
        initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock-${params.pagoId}`,
      };
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: String(params.pagoId),
            title: params.titulo,
            quantity: 1,
            unit_price: params.monto,
            currency_id: 'ARS',
          },
        ],
        external_reference: String(params.pagoId),
        payer: params.payerEmail
          ? { email: params.payerEmail }
          : undefined,
        // notification_url se configura en prod con URL pública (ngrok / api.clubapp...)
      },
    });

    return {
      preferenceId: result.id || '',
      initPoint: result.init_point || result.sandbox_init_point || '',
    };
  }

  async obtenerPago(paymentId: string) {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }
    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = new Payment(client);
    return payment.get({ id: paymentId });
  }
}

