/**
 * Parsing dos envelopes da API (ADR-014 F8). Função pura: não faz I/O e nunca
 * devolve o corpo bruto da resposta — apenas a forma já validada.
 *
 *  - sucesso: `{ success: true, data, timestamp }`
 *  - erro:    `{ success: false, error: { statusCode, error, message: string | string[] }, ... }`
 *  - `204`:   sem corpo
 */

export type Envelope<T = unknown> =
  | { kind: 'success'; status: number; data: T }
  | { kind: 'no_content'; status: 204 }
  | { kind: 'error'; status: number; messages: string[]; wellFormed: boolean }
  | { kind: 'unavailable' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(body: string | null): unknown {
  if (body === null || body.trim() === '') return undefined;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

function extractErrorMessages(parsed: unknown): string[] | null {
  if (!isRecord(parsed) || parsed.success !== false) return null;
  const error = parsed.error;
  if (!isRecord(error)) return null;
  if (typeof error.statusCode !== 'number') return null;
  const message = error.message;
  if (typeof message === 'string') return [message];
  if (Array.isArray(message) && message.every((m) => typeof m === 'string')) {
    return message as string[];
  }
  return null;
}

/**
 * Classifica a forma da resposta. `body` é o texto lido (ou `null` se não
 * houve leitura). Respostas `2xx` fora do formato esperado e códigos
 * inesperados (1xx/3xx) viram `unavailable`; erros `4xx/5xx` fora do formato
 * viram `error` com `wellFormed: false` (a decisão fica com o status).
 */
export function parseEnvelope(status: number, body: string | null): Envelope {
  if (status === 204) return { kind: 'no_content', status: 204 };

  if (status >= 200 && status < 300) {
    const parsed = parseJson(body);
    if (isRecord(parsed) && parsed.success === true && 'data' in parsed) {
      return { kind: 'success', status, data: parsed.data };
    }
    return { kind: 'unavailable' };
  }

  if (status >= 400 && status < 600) {
    const messages = extractErrorMessages(parseJson(body));
    if (messages === null) {
      return { kind: 'error', status, messages: [], wellFormed: false };
    }
    return { kind: 'error', status, messages, wellFormed: true };
  }

  return { kind: 'unavailable' };
}
