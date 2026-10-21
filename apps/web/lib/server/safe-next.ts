/**
 * Destino pós-login seguro (`next`) e listas fechadas de `reason`/`mode`
 * (ADR-014 §4/§8; AC-09). Funções puras.
 *
 * Aceita somente caminho relativo interno. Rejeita: `//x`, `/\x`, URLs
 * absolutas, `javascript:`, caracteres de controle, e os caminhos reservados
 * `/login`, `/session/*` e `/api/session/*` (inclusive codificados e com
 * segmentos `..`), para não criar laços nem alvos de sessão.
 */

export const DEFAULT_NEXT = '/projects';

/** Lista fechada de `reason` do Bloco A (B2 acrescentará `renewal`). */
export const REASONS = ['session'] as const;
export type Reason = (typeof REASONS)[number];

/** Lista fechada de `mode` do Bloco A (B1 usa `end`; `renew`/`unavailable` são B2). */
export const MODES = ['end'] as const;
export type Mode = (typeof MODES)[number];

const PLACEHOLDER_ORIGIN = 'http://safe-next.invalid';
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function isReservedPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/session' ||
    pathname.startsWith('/session/') ||
    pathname === '/api/session' ||
    pathname.startsWith('/api/session/')
  );
}

/**
 * Devolve o destino normalizado (`pathname` + `search`) ou `null` se inseguro.
 */
export function sanitizeNext(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw === '') return null;
  if (CONTROL_CHARS.test(raw)) return null;
  if (!raw.startsWith('/')) return null;
  if (raw.startsWith('//') || raw.includes('\\')) return null;

  let url: URL;
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (CONTROL_CHARS.test(decoded)) return null;
  if (decoded.startsWith('//') || decoded.includes('\\')) return null;

  if (isReservedPath(url.pathname) || isReservedPath(decoded)) return null;

  return `${url.pathname}${url.search}`;
}

/** `sanitizeNext` com destino padrão `/projects`. */
export function safeNextOrDefault(raw: unknown): string {
  return sanitizeNext(raw) ?? DEFAULT_NEXT;
}

export function parseReason(raw: unknown): Reason | null {
  return typeof raw === 'string' && (REASONS as readonly string[]).includes(raw)
    ? (raw as Reason)
    : null;
}

export function parseMode(raw: unknown): Mode | null {
  return typeof raw === 'string' && (MODES as readonly string[]).includes(raw)
    ? (raw as Mode)
    : null;
}
