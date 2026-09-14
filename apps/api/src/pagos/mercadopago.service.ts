import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';

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

  /**
   * Cobro directo con tarjeta (token generado por el SDK.js del navegador).
   * Se usa para verificar que la tarjeta es real (cobro chico + reembolso
   * inmediato), no para cobros de cuota (esos van por Preference/redirect).
   * Si no hay MP_ACCESS_TOKEN, simula un pago aprobado (demo/local).
   */
  async crearPagoVerificacion(params: {
    token: string;
    paymentMethodId: string;
    issuerId?: string;
    installments?: number;
    monto: number;
    descripcion: string;
    payerEmail: string;
    identificationType?: string;
    identificationNumber?: string;
  }): Promise<{ id: string; status: string; statusDetail?: string }> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      this.logger.warn(
        'MP_ACCESS_TOKEN no configurado: simulando pago de verificación de tarjeta',
      );
      return { id: `mock-payment-${Date.now()}`, status: 'approved', statusDetail: 'mock' };
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        transaction_amount: params.monto,
        token: params.token,
        description: params.descripcion,
        installments: params.installments ?? 1,
        payment_method_id: params.paymentMethodId,
        issuer_id: params.issuerId ? Number(params.issuerId) : undefined,
        payer: {
          email: params.payerEmail,
          identification:
            params.identificationType && params.identificationNumber
              ? {
                  type: params.identificationType,
                  number: params.identificationNumber,
                }
              : undefined,
        },
      },
    });

    return {
      id: String(result.id ?? ''),
      status: result.status || 'unknown',
      statusDetail: result.status_detail,
    };
  }

  /** Reembolso total de un pago. Si no hay MP_ACCESS_TOKEN, simula éxito. */
  async reembolsarPago(paymentId: string): Promise<boolean> {
    const accessToken = this.getAccessToken();
    if (!accessToken || paymentId.startsWith('mock-payment-')) {
      this.logger.warn('MP_ACCESS_TOKEN no configurado: simulando reembolso');
      return true;
    }
    const client = new MercadoPagoConfig({ accessToken });
    const refund = new PaymentRefund(client);
    const result = await refund.create({ payment_id: paymentId });
    return !!result?.id;
  }
}

