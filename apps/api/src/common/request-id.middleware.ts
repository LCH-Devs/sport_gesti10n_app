import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId: string };

// Alfanumérico + guiones, largo acotado: evita que un x-request-id entrante
// con saltos de línea u otros caracteres termine inyectado en los logs.
const ID_VALIDO = /^[a-zA-Z0-9-]{1,100}$/;

/**
 * Un id por request para poder correlacionar "el usuario vio este error"
 * con la línea exacta de log del server. Si ya viene un x-request-id de un
 * proxy/balanceador upstream, se respeta (deja trazar de punta a punta);
 * si no, se genera acá. Va también en la respuesta para que soporte pueda
 * pedírselo al usuario.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'];
    const trimmed = typeof incoming === 'string' ? incoming.trim() : '';
    const id = ID_VALIDO.test(trimmed) ? trimmed : randomUUID();
    (req as RequestWithId).requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  }
}
