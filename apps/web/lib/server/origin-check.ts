/**
 * Validação estrita do header `Origin` (ADR-014 §8, P12 aprovada).
 *
 * Função pura. A origem esperada vem EXCLUSIVAMENTE de `APP_ORIGIN`
 * (configuração). `Host`, `X-Forwarded-*` e `Forwarded` não são lidos nem
 * aceitos como substitutos: por isso a função recebe apenas o VALOR do header
 * `Origin`, nunca os cabeçalhos da requisição.
 *
 * Quem a usa (Route Handlers de sessão, B1/B2) deve chamá-la ANTES de ler o
 * corpo, tocar cookies ou chamar a API, e responder `403` neutro, sem
 * `Set-Cookie`, em caso de recusa, registrando só a `category`.
 */

export type OriginCategory =
  | 'config' // APP_ORIGIN ausente/inválida/não-http(s)
  | 'absent' // sem header Origin
  | 'null' // origem opaca "null"
  | 'invalid' // vazia, texto livre, múltipla, não interpretável por URL
  | 'scheme' // esquema diferente de http/https (file:, data:, chrome-extension:...)
  | 'non_canonical' // path, barra final, userinfo, maiúsculas, espaços, porta padrão explícita
  | 'mismatch'; // esquema, host ou porta divergentes de APP_ORIGIN

export type OriginCheckResult = { ok: true } | { ok: false; category: OriginCategory };

function normalizeAppOrigin(appOrigin: string | undefined): string | null {
  if (typeof appOrigin !== 'string') return null;
  let url: URL;
  try {
    url = new URL(appOrigin);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username !== '' || url.password !== '') return null;
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') return null;
  return url.origin;
}

export function checkOrigin(
  originHeader: string | null | undefined,
  appOrigin: string | undefined,
): OriginCheckResult {
  const expected = normalizeAppOrigin(appOrigin);
  if (expected === null) return { ok: false, category: 'config' };

  if (originHeader === null || originHeader === undefined) {
    return { ok: false, category: 'absent' };
  }
  if (originHeader === 'null') return { ok: false, category: 'null' };
  if (originHeader.trim() === '') return { ok: false, category: 'invalid' };

  let url: URL;
  try {
    url = new URL(originHeader);
  } catch {
    return { ok: false, category: 'invalid' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, category: 'scheme' };
  }
  // Valores múltiplos ("a, b") não são uma única origem.
  if (originHeader.includes(',')) return { ok: false, category: 'invalid' };
  // Forma canônica: o texto do header deve ser exatamente a origem serializada.
  if (originHeader !== url.origin) {
    return { ok: false, category: 'non_canonical' };
  }
  if (url.origin !== expected) return { ok: false, category: 'mismatch' };

  return { ok: true };
}
