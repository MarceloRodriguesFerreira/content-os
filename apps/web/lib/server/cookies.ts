/**
 * Cookies de sessão do Bloco A (ADR-014 §2).
 *
 *  - `cos_access`  (`Path=/`):             access token
 *  - `cos_refresh` (`Path=/api/session`):  refresh token (só viaja a `/api/session/*`)
 *
 * Ambos: `HttpOnly`, `SameSite=Lax`, sem `Domain`, `Max-Age` configurado
 * (`SESSION_COOKIE_MAX_AGE_SECONDS`, não o `exp` do JWT) e `Secure` somente
 * em produção. `cos_renewed` pertence ao Bloco B2 e NÃO existe aqui.
 *
 * O armazenamento de cookies é INJETADO (`CookieWriter`), de modo que a
 * lógica seja testável sem o Next em execução. `cookies()`/`NextResponse`
 * satisfazem a interface estruturalmente.
 */

export const ACCESS_COOKIE = 'cos_access';
export const REFRESH_COOKIE = 'cos_refresh';

export const ACCESS_COOKIE_PATH = '/';
export const REFRESH_COOKIE_PATH = '/api/session';

export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
};

export type CookieWriter = {
  set(name: string, value: string, options: SessionCookieOptions): unknown;
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export type CookieEnvironment = {
  /** `true` quando `NODE_ENV === "production"` (HIP-6: `Secure` só aí). */
  production: boolean;
};

export type SessionCookieSettings = CookieEnvironment & {
  /** `SESSION_COOKIE_MAX_AGE_SECONDS` já validado. */
  maxAgeSeconds: number;
};

/** Valor de `production` a partir do ambiente do processo. */
export function isProductionEnvironment(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.NODE_ENV === 'production';
}

function options(path: string, maxAge: number, production: boolean): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: production,
    path,
    maxAge,
  };
}

/** Grava `cos_access` e `cos_refresh` com o `Max-Age` configurado. */
export function writeSessionCookies(
  store: CookieWriter,
  tokens: SessionTokens,
  settings: SessionCookieSettings,
): void {
  const { maxAgeSeconds, production } = settings;
  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds <= 0) {
    // Falha fechada: nunca grava cookie com Max-Age inválido.
    throw new RangeError('maxAgeSeconds deve ser inteiro positivo.');
  }
  store.set(
    ACCESS_COOKIE,
    tokens.accessToken,
    options(ACCESS_COOKIE_PATH, maxAgeSeconds, production),
  );
  store.set(
    REFRESH_COOKIE,
    tokens.refreshToken,
    options(REFRESH_COOKIE_PATH, maxAgeSeconds, production),
  );
}

/**
 * Remove os cookies de sessão reemitindo-os com o MESMO `Path`, valor vazio e
 * `Max-Age=0` (sem o mesmo `Path` o navegador não remove).
 */
export function clearSessionCookies(store: CookieWriter, environment: CookieEnvironment): void {
  store.set(ACCESS_COOKIE, '', options(ACCESS_COOKIE_PATH, 0, environment.production));
  store.set(REFRESH_COOKIE, '', options(REFRESH_COOKIE_PATH, 0, environment.production));
}
