/**
 * DAL — único ponto de acesso HTTP à API (ADR-014 §1/§3; AC-35, AC-36).
 *
 * Envia `Authorization: Bearer` quando há access token, `cache: "no-store"` e
 * timeout, e CLASSIFICA a resposta. A API decide autenticação/autorização:
 * este módulo não valida token, não renova e não toca cookies.
 *
 *  - `401`  ⇒ `session_expired`
 *  - `403`  ⇒ `forbidden`    (cookies intactos)
 *  - `404`  ⇒ `not_found`
 *  - `400`  ⇒ `invalid`      (mensagens para erros por campo)
 *  - `5xx`, rede, timeout, corpo fora do envelope, status inesperado
 *           ⇒ `unavailable`  (não remove cookies, não renova)
 *
 * Nada de token, stack, `path` ou corpo bruto é devolvido.
 */

import { parseEnvelope } from '../api/envelope';
import type { AppConfig } from './config';

export const DEFAULT_TIMEOUT_MS = 10_000;

export type UnavailableReason =
  | 'network'
  | 'timeout'
  | 'server_error'
  | 'bad_body'
  | 'unexpected_status';

export type ApiResult<T = unknown> =
  | { kind: 'ok'; status: number; data: T }
  | { kind: 'no_content' }
  | { kind: 'session_expired' }
  | { kind: 'forbidden' }
  | { kind: 'not_found' }
  | { kind: 'invalid'; messages: string[] }
  | { kind: 'unavailable'; reason: UnavailableReason };

export type ApiRequest = {
  config: Pick<AppConfig, 'apiBaseUrl'>;
  method: 'GET' | 'POST';
  /** Caminho absoluto da API, ex.: `/v1/users/me`. */
  path: string;
  /** Ausente apenas em endpoints públicos (login). */
  accessToken?: string;
  /** Corpo JSON (somente `POST`). */
  body?: unknown;
  timeoutMs?: number;
  /** Injetável para testes. */
  fetchImpl?: typeof fetch;
};

function isTimeout(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}

export async function apiRequest<T = unknown>(request: ApiRequest): Promise<ApiResult<T>> {
  const { config, method, path, accessToken, body } = request;
  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const doFetch = request.fetchImpl ?? fetch;

  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new RangeError('path deve ser um caminho absoluto da API.');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (accessToken !== undefined) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await doFetch(`${config.apiBaseUrl}${path}`, init);
  } catch (error) {
    return {
      kind: 'unavailable',
      reason: isTimeout(error) ? 'timeout' : 'network',
    };
  }

  const status = response.status;

  if (status === 401) return { kind: 'session_expired' };
  if (status === 403) return { kind: 'forbidden' };
  if (status === 404) return { kind: 'not_found' };
  if (status >= 500) return { kind: 'unavailable', reason: 'server_error' };

  let text: string | null = null;
  if (status !== 204) {
    try {
      text = await response.text();
    } catch (error) {
      return {
        kind: 'unavailable',
        reason: isTimeout(error) ? 'timeout' : 'bad_body',
      };
    }
  }

  const envelope = parseEnvelope(status, text);
  switch (envelope.kind) {
    case 'success':
      return { kind: 'ok', status, data: envelope.data as T };
    case 'no_content':
      return { kind: 'no_content' };
    case 'error':
      if (status === 400) return { kind: 'invalid', messages: envelope.messages };
      return { kind: 'unavailable', reason: 'unexpected_status' };
    case 'unavailable':
      return {
        kind: 'unavailable',
        reason: status >= 200 && status < 300 ? 'bad_body' : 'unexpected_status',
      };
  }
}
