import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { apiRequest } from './api-client';

/**
 * Nível I (ADR §9): API SIMULADA em `node:http`, porta efêmera, com `fetch` real.
 * Prova o comportamento do NOSSO código dado o modelo de API assumido; não prova
 * a API real nem o Next/navegador.
 */

type Seen = { method?: string; url?: string; authorization?: string; body: string };

let server: Server;
let baseUrl: string;
const seen: Seen[] = [];

const json = (res: ServerResponse, status: number, payload: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
};
const okEnv = (data: unknown) => ({ success: true, data, timestamp: 't' });
const errEnv = (statusCode: number, message: string | string[]) => ({
  success: false,
  error: { statusCode, error: 'E', message },
  path: '/x',
  timestamp: 't',
});

function handle(req: IncomingMessage, res: ServerResponse) {
  const chunks: Buffer[] = [];
  req.on('data', (c: Buffer) => chunks.push(c));
  req.on('end', () => {
    seen.push({
      method: req.method,
      url: req.url,
      authorization: req.headers.authorization,
      body: Buffer.concat(chunks).toString('utf8'),
    });
    switch (req.url) {
      case '/ok':
        return json(res, 200, okEnv({ id: 1 }));
      case '/created':
        return json(res, 201, okEnv({ id: 2 }));
      case '/no-content':
        res.writeHead(204);
        return res.end();
      case '/401':
        return json(res, 401, errEnv(401, 'Unauthorized'));
      case '/403':
        return json(res, 403, errEnv(403, 'Forbidden'));
      case '/404':
        return json(res, 404, errEnv(404, 'Not Found'));
      case '/400':
        return json(res, 400, errEnv(400, ['name should not be empty']));
      case '/500':
        return json(res, 500, errEnv(500, 'Internal server error'));
      case '/500-html':
        res.writeHead(502, { 'content-type': 'text/html' });
        return res.end('<html>bad gateway</html>');
      case '/bad-json':
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end('{"success":true,');
      case '/wrong-shape':
        return json(res, 200, { hello: 'world' });
      case '/truncated':
        res.writeHead(200, { 'content-type': 'application/json', 'content-length': '200' });
        res.write('{"success":true,"da');
        return setTimeout(() => res.destroy(), 20);
      case '/destroy':
        return req.socket.destroy();
      case '/hang':
        return; // nunca responde
      default:
        return json(res, 404, errEnv(404, 'Not Found'));
    }
  });
}

beforeAll(async () => {
  server = createServer(handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const get = (path: string, extra: { timeoutMs?: number; baseUrl?: string } = {}) =>
  apiRequest({
    config: { apiBaseUrl: extra.baseUrl ?? baseUrl },
    method: 'GET',
    path,
    accessToken: 'tok-int',
    timeoutMs: extra.timeoutMs,
  });

describe('AC-35 (I): DAL contra API simulada com fetch real', () => {
  it('2xx ⇒ ok; envia Bearer ao servidor', async () => {
    seen.length = 0;
    expect(await get('/ok')).toEqual({ kind: 'ok', status: 200, data: { id: 1 } });
    expect(seen).toHaveLength(1);
    expect(seen[0]?.authorization).toBe('Bearer tok-int');
    expect(seen[0]?.method).toBe('GET');
  });

  it('201 ⇒ ok; 204 ⇒ no_content', async () => {
    expect(await get('/created')).toEqual({ kind: 'ok', status: 201, data: { id: 2 } });
    expect(await get('/no-content')).toEqual({ kind: 'no_content' });
  });

  it('POST envia o corpo JSON', async () => {
    seen.length = 0;
    const result = await apiRequest({
      config: { apiBaseUrl: baseUrl },
      method: 'POST',
      path: '/created',
      accessToken: 'tok-int',
      body: { name: 'Projeto' },
    });
    expect(result.kind).toBe('ok');
    expect(seen[0]?.method).toBe('POST');
    expect(seen[0]?.body).toBe(JSON.stringify({ name: 'Projeto' }));
  });

  it('401 ⇒ session_expired; 403 ⇒ forbidden; 404 ⇒ not_found', async () => {
    expect(await get('/401')).toEqual({ kind: 'session_expired' });
    expect(await get('/403')).toEqual({ kind: 'forbidden' });
    expect(await get('/404')).toEqual({ kind: 'not_found' });
  });

  it('400 ⇒ invalid com mensagens', async () => {
    expect(await get('/400')).toEqual({
      kind: 'invalid',
      messages: ['name should not be empty'],
    });
  });

  it('5xx (JSON ou HTML) ⇒ unavailable/server_error', async () => {
    expect(await get('/500')).toEqual({ kind: 'unavailable', reason: 'server_error' });
    expect(await get('/500-html')).toEqual({ kind: 'unavailable', reason: 'server_error' });
  });

  it('corpo inválido ou fora da forma ⇒ unavailable/bad_body', async () => {
    expect(await get('/bad-json')).toEqual({ kind: 'unavailable', reason: 'bad_body' });
    expect(await get('/wrong-shape')).toEqual({ kind: 'unavailable', reason: 'bad_body' });
  });

  it('resposta truncada ⇒ unavailable (sem expor o pedaço recebido)', async () => {
    const result = await get('/truncated');
    expect(result.kind).toBe('unavailable');
    expect(JSON.stringify(result)).not.toContain('success');
  });

  it('soquete destruído após receber a requisição ⇒ unavailable/network', async () => {
    expect(await get('/destroy')).toEqual({ kind: 'unavailable', reason: 'network' });
  });

  it('conexão recusada ⇒ unavailable/network', async () => {
    const probe = createServer();
    await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const port = (probe.address() as AddressInfo).port;
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    expect(await get('/ok', { baseUrl: `http://127.0.0.1:${port}` })).toEqual({
      kind: 'unavailable',
      reason: 'network',
    });
  });

  it('servidor que não responde ⇒ unavailable/timeout', async () => {
    const started = Date.now();
    expect(await get('/hang', { timeoutMs: 150 })).toEqual({
      kind: 'unavailable',
      reason: 'timeout',
    });
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it('403 e 5xx: nenhuma nova tentativa (1 requisição cada)', async () => {
    seen.length = 0;
    await get('/403');
    await get('/500');
    expect(seen.map((s) => s.url)).toEqual(['/403', '/500']);
  });
});
