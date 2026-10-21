import { NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_PATH,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  clearSessionCookies,
  isProductionEnvironment,
  writeSessionCookies,
  type CookieWriter,
  type SessionCookieOptions,
} from './cookies';

type Call = { name: string; value: string; options: SessionCookieOptions };

function recorder(): { store: CookieWriter; calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    store: { set: (name, value, options) => void calls.push({ name, value, options }) },
  };
}

const tokens = { accessToken: 'acc.tok.en', refreshToken: 'refresh-opaque' };

describe('AC-03: cookies de sessão', () => {
  it('cos_access (Path=/) e cos_refresh (Path=/api/session) com atributos corretos', () => {
    const { store, calls } = recorder();
    writeSessionCookies(store, tokens, { maxAgeSeconds: 604800, production: false });

    expect(calls).toHaveLength(2);
    const access = calls.find((c) => c.name === ACCESS_COOKIE);
    const refresh = calls.find((c) => c.name === REFRESH_COOKIE);

    expect(access).toEqual({
      name: 'cos_access',
      value: tokens.accessToken,
      options: { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 604800 },
    });
    expect(refresh).toEqual({
      name: 'cos_refresh',
      value: tokens.refreshToken,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/api/session',
        maxAge: 604800,
      },
    });
    expect(ACCESS_COOKIE_PATH).toBe('/');
    expect(REFRESH_COOKIE_PATH).toBe('/api/session');
  });

  it('não define Domain', () => {
    const { store, calls } = recorder();
    writeSessionCookies(store, tokens, { maxAgeSeconds: 60, production: true });
    for (const call of calls) expect(call.options).not.toHaveProperty('domain');
  });

  it('Secure somente em production', () => {
    const dev = recorder();
    writeSessionCookies(dev.store, tokens, { maxAgeSeconds: 60, production: false });
    expect(dev.calls.every((c) => c.options.secure === false)).toBe(true);

    const prod = recorder();
    writeSessionCookies(prod.store, tokens, { maxAgeSeconds: 60, production: true });
    expect(prod.calls.every((c) => c.options.secure === true)).toBe(true);
  });

  it('isProductionEnvironment lê NODE_ENV', () => {
    expect(isProductionEnvironment({ NODE_ENV: 'production' })).toBe(true);
    expect(isProductionEnvironment({ NODE_ENV: 'development' })).toBe(false);
    expect(isProductionEnvironment({ NODE_ENV: 'test' })).toBe(false);
    expect(isProductionEnvironment({})).toBe(false);
  });

  it('Max-Age inválido ⇒ falha fechada, sem gravar nada', () => {
    for (const bad of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const { store, calls } = recorder();
      expect(() =>
        writeSessionCookies(store, tokens, { maxAgeSeconds: bad, production: false }),
      ).toThrow(RangeError);
      expect(calls).toHaveLength(0);
    }
  });

  it('não cria cos_renewed (pertence ao B2)', () => {
    const { store, calls } = recorder();
    writeSessionCookies(store, tokens, { maxAgeSeconds: 60, production: false });
    clearSessionCookies(store, { production: false });
    expect(calls.map((c) => c.name)).not.toContain('cos_renewed');
  });

  it('os atributos chegam ao Set-Cookie real do Next (NextResponse)', () => {
    const response = NextResponse.json({});
    writeSessionCookies(response.cookies, tokens, { maxAgeSeconds: 604800, production: true });
    const headers = response.headers.getSetCookie();
    expect(headers).toHaveLength(2);

    const access = headers.find((h) => h.startsWith('cos_access='));
    const refresh = headers.find((h) => h.startsWith('cos_refresh='));
    expect(access).toMatch(/Path=\/(;|$)/);
    expect(refresh).toMatch(/Path=\/api\/session(;|$)/);
    for (const header of [access, refresh]) {
      expect(header).toMatch(/Max-Age=604800/);
      expect(header).toMatch(/HttpOnly/i);
      expect(header).toMatch(/SameSite=lax/i);
      expect(header).toMatch(/Secure/i);
      expect(header).not.toMatch(/Domain=/i);
    }
  });
});

describe('AC-04: remoção reemite os cookies com o mesmo Path e Max-Age=0', () => {
  it('valor vazio, Max-Age=0, mesmo Path de cada cookie', () => {
    const { store, calls } = recorder();
    clearSessionCookies(store, { production: false });
    expect(calls).toEqual([
      {
        name: 'cos_access',
        value: '',
        options: { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 0 },
      },
      {
        name: 'cos_refresh',
        value: '',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          path: '/api/session',
          maxAge: 0,
        },
      },
    ]);
  });

  it('emite os dois cookies mesmo sem sessão prévia', () => {
    const { store, calls } = recorder();
    clearSessionCookies(store, { production: true });
    expect(calls.map((c) => c.name).sort()).toEqual(['cos_access', 'cos_refresh']);
    expect(calls.every((c) => c.options.secure)).toBe(true);
  });

  it('o Set-Cookie real do Next traz Path correto e Max-Age=0', () => {
    const response = NextResponse.json({});
    clearSessionCookies(response.cookies, { production: false });
    const headers = response.headers.getSetCookie();
    const access = headers.find((h) => h.startsWith('cos_access='));
    const refresh = headers.find((h) => h.startsWith('cos_refresh='));
    expect(access).toMatch(/^cos_access=;/);
    expect(access).toMatch(/Path=\/(;|$)/);
    expect(refresh).toMatch(/^cos_refresh=;/);
    expect(refresh).toMatch(/Path=\/api\/session(;|$)/);
    for (const header of [access, refresh]) expect(header).toMatch(/Max-Age=0/);
  });
});
