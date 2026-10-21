import { describe, expect, it } from 'vitest';
import { DEFAULT_NEXT, parseMode, parseReason, safeNextOrDefault, sanitizeNext } from './safe-next';

describe('AC-09: sanitizeNext rejeita destinos inseguros', () => {
  const rejected: Array<[string, unknown]> = [
    ['//evil.test', '//evil.test'],
    ['//evil.test/path', '//evil.test/path'],
    ['/\\evil.test', '/\\evil.test'],
    ['barra invertida no meio', '/projects\\x'],
    ['URL absoluta https', 'https://evil.test'],
    ['URL absoluta http', 'http://evil.test/projects'],
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:text/html,x'],
    ['relativo sem barra', 'projects'],
    ['vazio', ''],
    ['não string (undefined)', undefined],
    ['não string (null)', null],
    ['não string (número)', 5],
    ['não string (array)', ['/projects']],
    ['caractere de controle (\\n)', '/projects\nSet-Cookie: x=1'],
    ['caractere de controle (\\r)', '/projects\r'],
    ['caractere de controle (NUL)', '/projects\u0000'],
    ['caractere de controle (DEL)', '/projects\u007f'],
    ['tab', '/pro\tjects'],
    ['/login', '/login'],
    ['/login com query', '/login?x=1'],
    ['/login/…', '/login/x'],
    ['/session', '/session'],
    ['/session/continue', '/session/continue?mode=end'],
    ['/api/session', '/api/session'],
    ['/api/session/end', '/api/session/end'],
    ['/api/session/logout', '/api/session/logout'],
    ['/login codificado', '/%6Cogin'],
    ['/api/session codificado', '/api/%73ession/end'],
    ['segmento .. para /login', '/projects/../login'],
    ['segmento .. para /api/session', '/a/../api/session/end'],
    ['barra dupla codificada', '/%2F%2Fevil.test'],
    ['barra invertida codificada', '/%5Cevil.test'],
    ['codificação inválida', '/%E0%A4%A'],
  ];
  it.each(rejected)('%s', (_label, input) => {
    expect(sanitizeNext(input)).toBeNull();
  });

  it('aceita /projects?page=2 e preserva a query', () => {
    expect(sanitizeNext('/projects?page=2')).toBe('/projects?page=2');
    expect(sanitizeNext('/projects')).toBe('/projects');
    expect(sanitizeNext('/projects/abc?status=ACTIVE&page=2')).toBe(
      '/projects/abc?status=ACTIVE&page=2',
    );
  });

  it('não confunde prefixos parecidos com caminhos reservados', () => {
    expect(sanitizeNext('/login-help')).toBe('/login-help');
    expect(sanitizeNext('/sessions')).toBe('/sessions');
    expect(sanitizeNext('/api/sessions')).toBe('/api/sessions');
  });

  it('descarta o fragmento e normaliza segmentos ..', () => {
    expect(sanitizeNext('/projects#x')).toBe('/projects');
    expect(sanitizeNext('/a/b/../projects')).toBe('/a/projects');
  });

  it('safeNextOrDefault cai em /projects', () => {
    expect(DEFAULT_NEXT).toBe('/projects');
    expect(safeNextOrDefault('//evil.test')).toBe('/projects');
    expect(safeNextOrDefault(undefined)).toBe('/projects');
    expect(safeNextOrDefault('/projects?page=2')).toBe('/projects?page=2');
  });
});

describe('AC-09: reason e mode só de lista fechada', () => {
  it('reason', () => {
    expect(parseReason('session')).toBe('session');
    for (const bad of ['renewal', 'Session', '', 'x', undefined, null, 1, ['session']]) {
      expect(parseReason(bad)).toBeNull();
    }
  });

  it('mode', () => {
    expect(parseMode('end')).toBe('end');
    for (const bad of ['renew', 'unavailable', 'END', '', 'x', undefined, null, 1]) {
      expect(parseMode(bad)).toBeNull();
    }
  });
});
