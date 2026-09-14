import { RequestIdMiddleware, type RequestWithId } from './request-id.middleware';

function makeReqRes(headers: Record<string, string> = {}) {
  const req = { headers } as unknown as RequestWithId;
  const setHeader = jest.fn();
  const res = { setHeader } as any;
  return { req, res, setHeader };
}

describe('RequestIdMiddleware', () => {
  const middleware = new RequestIdMiddleware();

  it('genera un id nuevo si no viene ninguno', () => {
    const { req, res, setHeader } = makeReqRes();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toMatch(/^[a-f0-9-]{36}$/);
    expect(setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
    expect(next).toHaveBeenCalled();
  });

  it('respeta un x-request-id entrante válido (traza de punta a punta)', () => {
    const { req, res } = makeReqRes({ 'x-request-id': 'abc-123-DEF' });
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBe('abc-123-DEF');
  });

  it('ignora un x-request-id con caracteres raros (evita log injection) y genera uno propio', () => {
    const { req, res } = makeReqRes({
      'x-request-id': 'malicioso\nFAKE LOG LINE INYECTADA',
    });
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).not.toContain('\n');
    expect(req.requestId).toMatch(/^[a-f0-9-]{36}$/);
  });
});
