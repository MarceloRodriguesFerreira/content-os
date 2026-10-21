import { describe, expect, it } from 'vitest';
import {
  CONFIG_VARS,
  ConfigError,
  getConfig,
  loadConfig,
  resetConfigCacheForTests,
} from './config';

const valid = {
  API_BASE_URL: 'http://localhost:3001',
  SESSION_COOKIE_MAX_AGE_SECONDS: '604800',
  APP_ORIGIN: 'http://localhost:3000',
};

function failure(env: Record<string, string | undefined>): ConfigError {
  try {
    loadConfig(env);
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigError);
    return error as ConfigError;
  }
  throw new Error('loadConfig deveria ter falhado');
}

describe('loadConfig: caso válido', () => {
  it('devolve a configuração normalizada', () => {
    expect(loadConfig(valid)).toEqual({
      apiBaseUrl: 'http://localhost:3001',
      sessionCookieMaxAgeSeconds: 604800,
      appOrigin: 'http://localhost:3000',
    });
  });

  it('remove a barra final da API_BASE_URL', () => {
    expect(loadConfig({ ...valid, API_BASE_URL: 'https://api.exemplo.test/' }).apiBaseUrl).toBe(
      'https://api.exemplo.test',
    );
  });

  it('normaliza APP_ORIGIN (host em minúsculas, porta padrão omitida)', () => {
    expect(loadConfig({ ...valid, APP_ORIGIN: 'HTTPS://App.Exemplo.test:443' }).appOrigin).toBe(
      'https://app.exemplo.test',
    );
  });
});

describe('AC-01: API_BASE_URL ausente/inválida ⇒ falha fechada', () => {
  const cases: Array<[string, string | undefined]> = [
    ['ausente', undefined],
    ['vazia', ''],
    ['só espaços', '   '],
    ['texto livre', 'não é url'],
    ['sem esquema', 'localhost:3001'],
    ['esquema não http(s)', 'ftp://localhost:3001'],
    ['com credenciais', 'http://user:senha@localhost:3001'],
  ];
  it.each(cases)('%s', (_label, value) => {
    const error = failure({ ...valid, API_BASE_URL: value });
    expect(error.issues.join(' ')).toContain('API_BASE_URL');
  });
});

describe('AC-02: SESSION_COOKIE_MAX_AGE_SECONDS ausente/inválido ⇒ falha fechada', () => {
  const cases: Array<[string, string | undefined]> = [
    ['ausente', undefined],
    ['vazio', ''],
    ['zero', '0'],
    ['negativo', '-1'],
    ['decimal', '10.5'],
    ['não numérico', '7d'],
    ['notação científica', '1e3'],
    ['com sinal', '+60'],
    ['com espaço', ' 60'],
    ['acima do inteiro seguro', '9007199254740993'],
  ];
  it.each(cases)('%s', (_label, value) => {
    const error = failure({ ...valid, SESSION_COOKIE_MAX_AGE_SECONDS: value });
    expect(error.issues.join(' ')).toContain('SESSION_COOKIE_MAX_AGE_SECONDS');
  });

  it('não há valor padrão silencioso: sem a variável a configuração falha', () => {
    const rest: Record<string, string | undefined> = { ...valid };
    delete rest.SESSION_COOKIE_MAX_AGE_SECONDS;
    expect(() => loadConfig(rest)).toThrow(ConfigError);
  });

  it('válido ⇒ o número é o usado nos cookies (e é lido como inteiro)', () => {
    expect(
      loadConfig({ ...valid, SESSION_COOKIE_MAX_AGE_SECONDS: '3600' }).sessionCookieMaxAgeSeconds,
    ).toBe(3600);
  });
});

describe('AC-15.7: APP_ORIGIN ausente/inválida/não-http(s)/com path ⇒ falha fechada', () => {
  const cases: Array<[string, string | undefined]> = [
    ['ausente', undefined],
    ['vazia', ''],
    ['texto livre', 'localhost'],
    ['não http(s)', 'ftp://localhost:3000'],
    ['com path', 'http://localhost:3000/app'],
    ['com barra final', 'http://localhost:3000/'],
    ['com query', 'http://localhost:3000?x=1'],
    ['com fragmento', 'http://localhost:3000#x'],
    ['com credenciais', 'http://u:p@localhost:3000'],
  ];
  it.each(cases)('%s', (_label, value) => {
    const error = failure({ ...valid, APP_ORIGIN: value });
    expect(error.issues.join(' ')).toContain('APP_ORIGIN');
  });
});

describe('falha fechada sem vazar valores', () => {
  it('issues citam nomes de variáveis, nunca os valores', () => {
    const secret = 'segredo-do-usuario';
    const error = failure({
      API_BASE_URL: `http://admin:${secret}@host`,
      SESSION_COOKIE_MAX_AGE_SECONDS: `x${secret}`,
      APP_ORIGIN: `http://host/${secret}`,
    });
    expect(error.issues).toHaveLength(3);
    expect(JSON.stringify(error.issues)).not.toContain(secret);
    expect(error.message).not.toContain(secret);
    expect(error.category).toBe('config');
  });

  it('acumula todas as variáveis com problema', () => {
    expect(failure({}).issues).toHaveLength(3);
  });
});

describe('getConfig', () => {
  it('lê process.env, memoriza o sucesso e não memoriza a falha', () => {
    const keys = Object.keys(valid) as Array<keyof typeof valid>;
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    try {
      resetConfigCacheForTests();
      for (const k of keys) delete process.env[k];
      expect(() => getConfig()).toThrow(ConfigError);

      Object.assign(process.env, valid);
      const first = getConfig();
      expect(first.sessionCookieMaxAgeSeconds).toBe(604800);

      process.env[CONFIG_VARS.sessionCookieMaxAgeSeconds] = '1';
      expect(getConfig()).toBe(first);
    } finally {
      for (const k of keys) {
        const v = saved[k];
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
      resetConfigCacheForTests();
    }
  });
});

describe('API_BASE_URL sem query ou fragmento', () => {
  it.each([
    ['query', 'https://api.exemplo.test?x=1'],
    ['fragmento', 'https://api.exemplo.test#secao'],
  ])('rejeita URL com %s', (_label, value) => {
    const error = failure({
      ...valid,
      API_BASE_URL: value,
    });

    expect(error.issues.join(' ')).toContain('API_BASE_URL');
  });
});
