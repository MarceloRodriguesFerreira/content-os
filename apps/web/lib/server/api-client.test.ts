import { describe, expect, it } from 'vitest';
import { apiRequest, type ApiResult } from './api-client';

const config = { apiBaseUrl: 'http://api.test' };

type Captured = { url: string; init: RequestInit };

function fakeFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>): {
  fetchImpl: typeof fetch;
  calls: Captured[];
} {
  const calls: Captured[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init: init ?? {} });
    return respond(url, init ?? {});
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const ok = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ success: true, data, timestamp: 't' }), { status });
const err = (status: number, message: string | string[]) =>
  new Response(
    JSON.stringify({
      success: false,
      error: { statusCode: status, error: 'E', message },
      path: '/x',
    }),
    { status },
  );

async function call(
  respond: (url: string, init: RequestInit) => Response | Promise<Response>,
  extra: Partial<Parameters<typeof apiRequest>[0]> = {},
): Promise<{ result: ApiResult; calls: Captured[] }> {
  const { fetchImpl, calls } = fakeFetch(respond);
  const result = await apiRequest({
    config,
    method: 'GET',
    path: '/v1/users/me',
    accessToken: 'tok-123',
    fetchImpl,
    ...extra,
  });
  return { result, calls };
}

describe('AC-35: requisição enviada pelo DAL', () => {
  it('sempre Bearer, cache no-store e timeout (signal)', async () => {
    const { calls } = await call(() => ok({ id: 1 }));
    expect(calls).toHaveLength(1);
    const [first] = calls;
    expect(first?.url).toBe('http://api.test/v1/users/me');
    expect(first?.init.method).toBe('GET');
    expect(first?.init.cache).toBe('no-store');
    expect(first?.init.signal).toBeInstanceOf(AbortSignal);
    const headers = first?.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok-123');
    expect(headers.Accept).toBe('application/json');
  });

  it('POST envia JSON e Content-Type; sem token (login) não envia Authorization', async () => {
    const { calls } = await call(() => ok({ accessToken: 'a', refreshToken: 'r' }), {
      method: 'POST',
      path: '/v1/auth/login',
      accessToken: undefined,
      body: { email: 'a@b.c', password: 'x' },
    });
    const [first] = calls;
    const headers = first?.init.headers as Record<string, string>;
    expect(headers).not.toHaveProperty('Authorization');
    expect(headers['Content-Type']).toBe('application/json');
    expect(first?.init.body).toBe(JSON.stringify({ email: 'a@b.c', password: 'x' }));
    expect(first?.init.cache).toBe('no-store');
  });

  it('rejeita path que não seja absoluto da API (sem chamar a rede)', async () => {
    const { fetchImpl, calls } = fakeFetch(() => ok({}));
    for (const path of ['v1/x', '//evil.test/x', 'http://evil.test/x']) {
      await expect(
        apiRequest({ config, method: 'GET', path, accessToken: 't', fetchImpl }),
      ).rejects.toThrow(RangeError);
    }
    expect(calls).toHaveLength(0);
  });
});

describe('AC-35: classificação das respostas', () => {
  it('2xx válido ⇒ ok com data', async () => {
    const { result } = await call(() => ok({ id: 7 }));
    expect(result).toEqual({ kind: 'ok', status: 200, data: { id: 7 } });
  });

  it('201 ⇒ ok', async () => {
    const { result } = await call(() => ok({ id: 8 }, 201));
    expect(result).toEqual({ kind: 'ok', status: 201, data: { id: 8 } });
  });

  it('204 ⇒ no_content', async () => {
    const { result } = await call(() => new Response(null, { status: 204 }));
    expect(result).toEqual({ kind: 'no_content' });
  });

  it('401 ⇒ session_expired', async () => {
    const { result } = await call(() => err(401, 'Unauthorized'));
    expect(result).toEqual({ kind: 'session_expired' });
  });

  it('403 ⇒ forbidden; 404 ⇒ not_found', async () => {
    expect((await call(() => err(403, 'x'))).result).toEqual({ kind: 'forbidden' });
    expect((await call(() => err(404, 'x'))).result).toEqual({ kind: 'not_found' });
  });

  it('400 ⇒ invalid com as mensagens por campo', async () => {
    const { result } = await call(() => err(400, ['name must be shorter', 'x']));
    expect(result).toEqual({ kind: 'invalid', messages: ['name must be shorter', 'x'] });
  });

  it('400 fora do envelope ⇒ invalid sem mensagens', async () => {
    const { result } = await call(() => new Response('lixo', { status: 400 }));
    expect(result).toEqual({ kind: 'invalid', messages: [] });
  });

  it('5xx (com e sem corpo) ⇒ unavailable/server_error', async () => {
    for (const status of [500, 502, 503, 504]) {
      expect((await call(() => err(status, 'boom'))).result).toEqual({
        kind: 'unavailable',
        reason: 'server_error',
      });
      expect((await call(() => new Response('', { status }))).result).toEqual({
        kind: 'unavailable',
        reason: 'server_error',
      });
    }
  });

  it('2xx com corpo inválido/ilegível ⇒ unavailable/bad_body', async () => {
    for (const body of ['<html>', '', '{"success":true', '[]', '{"success":true}']) {
      expect((await call(() => new Response(body, { status: 200 }))).result).toEqual({
        kind: 'unavailable',
        reason: 'bad_body',
      });
    }
  });

  it('4xx inesperado (ex.: 409, 422) ⇒ unavailable/unexpected_status', async () => {
    for (const status of [409, 422]) {
      expect((await call(() => err(status, 'x'))).result).toEqual({
        kind: 'unavailable',
        reason: 'unexpected_status',
      });
    }
  });

  it('falha de rede ⇒ unavailable/network', async () => {
    const { result } = await call(() => {
      throw new TypeError('fetch failed');
    });
    expect(result).toEqual({ kind: 'unavailable', reason: 'network' });
  });

  it('timeout/abort ⇒ unavailable/timeout', async () => {
    const { result } = await call(() => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });
    expect(result).toEqual({ kind: 'unavailable', reason: 'timeout' });
    const aborted = await call(() => {
      throw new DOMException('aborted', 'AbortError');
    });
    expect(aborted.result).toEqual({ kind: 'unavailable', reason: 'timeout' });
  });

  it('falha ao ler o corpo ⇒ unavailable/bad_body', async () => {
    const broken = new Response(
      new ReadableStream({
        start(controller) {
          controller.error(new Error('socket hang up'));
        },
      }),
      { status: 200 },
    );
    const { result } = await call(() => broken);
    expect(result).toEqual({ kind: 'unavailable', reason: 'bad_body' });
  });

  it('403 e 5xx não carregam nada que sugira remover cookies ou renovar', async () => {
    for (const status of [403, 500]) {
      const { result } = await call(() => err(status, 'x'));
      expect(['forbidden', 'unavailable']).toContain(result.kind);
      expect(result.kind).not.toBe('session_expired');
    }
  });

  it('o resultado nunca contém token nem corpo bruto', async () => {
    const secret = 'CORPO-SECRETO';
    const { result } = await call(
      () => new Response(`<html>${secret} Bearer tok-123</html>`, { status: 200 }),
    );
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain('tok-123');
  });
});
