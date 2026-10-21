/**
 * Configuração do servidor (ADR-014 §2, P1 e P12 aprovadas).
 *
 * Todas as variáveis são obrigatórias, só de servidor (sem `NEXT_PUBLIC_`) e
 * sem valor padrão silencioso. Ausente ou inválida ⇒ falha fechada: lança
 * `ConfigError`, cujo conteúdo cita apenas os NOMES das variáveis (nunca os
 * valores). Quem consome deve responder com erro genérico `500` e registrar
 * só `error.issues` no log.
 *
 * Limite (ADR §2): o frontend NÃO consegue verificar o TTL do refresh token
 * da API. Que `SESSION_COOKIE_MAX_AGE_SECONDS` não exceda o
 * `JWT_REFRESH_TTL` efetivo do mesmo ambiente é conferência humana, a ser
 * registrada por ambiente.
 */

export const CONFIG_VARS = {
  apiBaseUrl: 'API_BASE_URL',
  sessionCookieMaxAgeSeconds: 'SESSION_COOKIE_MAX_AGE_SECONDS',
  appOrigin: 'APP_ORIGIN',
} as const;

export type AppConfig = {
  /** URL base da API, sem barra final. */
  apiBaseUrl: string;
  /** `Max-Age` dos cookies de sessão, em segundos (inteiro positivo). */
  sessionCookieMaxAgeSeconds: number;
  /** Origem canônica (esquema + host + porta), normalizada por `URL`. */
  appOrigin: string;
};

export class ConfigError extends Error {
  readonly category = 'config' as const;
  /** Mensagens curtas por variável; nunca contêm valores de configuração. */
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super('Configuração do servidor ausente ou inválida.');
    this.name = 'ConfigError';
    this.issues = issues;
  }
}

type Env = Readonly<Record<string, string | undefined>>;

function parseHttpUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username !== '' || url.password !== '') return null;
  return url;
}

function readApiBaseUrl(env: Env, issues: string[]): string | null {
  const name = CONFIG_VARS.apiBaseUrl;
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') {
    issues.push(`${name}: ausente.`);
    return null;
  }

  const url = parseHttpUrl(raw);
  if (url === null || url.search !== '' || url.hash !== '') {
    issues.push(
      `${name}: deve ser URL absoluta http/https, sem credenciais, query ou fragmento.`,
    );
    return null;
  }
  return url.href.replace(/\/+$/, '');
}

function readMaxAge(env: Env, issues: string[]): number | null {
  const name = CONFIG_VARS.sessionCookieMaxAgeSeconds;
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') {
    issues.push(`${name}: ausente.`);
    return null;
  }
  if (!/^[0-9]+$/.test(raw)) {
    issues.push(`${name}: deve conter somente dígitos (inteiro positivo).`);
    return null;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    issues.push(`${name}: deve ser inteiro positivo.`);
    return null;
  }
  return value;
}

function readAppOrigin(env: Env, issues: string[]): string | null {
  const name = CONFIG_VARS.appOrigin;
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') {
    issues.push(`${name}: ausente.`);
    return null;
  }
  const url = parseHttpUrl(raw);
  const pure =
    url !== null &&
    url.pathname === '/' &&
    url.search === '' &&
    url.hash === '' &&
    !/[/?#]$/.test(raw) &&
    !raw.includes('?') &&
    !raw.includes('#');
  if (url === null || !pure) {
    issues.push(
      `${name}: deve ser origem http/https pura (sem path, query, fragmento ou credenciais).`,
    );
    return null;
  }
  return url.origin;
}

/** Função pura: valida o ambiente informado e devolve a configuração. */
export function loadConfig(env: Env): AppConfig {
  const issues: string[] = [];
  const apiBaseUrl = readApiBaseUrl(env, issues);
  const sessionCookieMaxAgeSeconds = readMaxAge(env, issues);
  const appOrigin = readAppOrigin(env, issues);

  if (
    issues.length > 0 ||
    apiBaseUrl === null ||
    sessionCookieMaxAgeSeconds === null ||
    appOrigin === null
  ) {
    throw new ConfigError(issues);
  }
  return { apiBaseUrl, sessionCookieMaxAgeSeconds, appOrigin };
}

let cached: AppConfig | undefined;

/**
 * Lê `process.env` na primeira utilização com sucesso e memoriza o resultado.
 * Falhas não são memorizadas (a próxima chamada valida de novo).
 */
export function getConfig(): AppConfig {
  if (cached === undefined) {
    cached = loadConfig(process.env);
  }
  return cached;
}

/** Uso exclusivo de testes: descarta a configuração memorizada. */
export function resetConfigCacheForTests(): void {
  cached = undefined;
}
