import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkOrigin } from './origin-check';

const APP = 'http://localhost:3000';

describe('AC-15.1: origem válida', () => {
  it('Origin idêntico à APP_ORIGIN ⇒ aceita', () => {
    expect(checkOrigin('http://localhost:3000', APP)).toEqual({ ok: true });
    expect(checkOrigin('https://app.exemplo.test', 'https://app.exemplo.test')).toEqual({
      ok: true,
    });
  });

  it('compara com a APP_ORIGIN normalizada (porta padrão ≡ sem porta; host em minúsculas)', () => {
    expect(checkOrigin('https://app.exemplo.test', 'https://APP.exemplo.test:443')).toEqual({
      ok: true,
    });
    expect(checkOrigin('http://app.exemplo.test', 'http://app.exemplo.test:80')).toEqual({
      ok: true,
    });
  });
});

describe('AC-15.2: Origin ausente', () => {
  it('sem header ⇒ recusa (absent)', () => {
    expect(checkOrigin(null, APP)).toEqual({ ok: false, category: 'absent' });
    expect(checkOrigin(undefined, APP)).toEqual({ ok: false, category: 'absent' });
  });
});

describe('AC-15.3: Origin inválida ou não canônica', () => {
  const invalid: Array<[string, string]> = [
    ['vazio', ''],
    ['só espaços', '   '],
    ['texto livre', 'localhost'],
    ['texto livre com espaço', 'not an origin'],
    ['múltiplos valores', 'http://localhost:3000, http://evil.test'],
    ['múltiplos valores iguais', 'http://localhost:3000, http://localhost:3000'],
  ];
  it.each(invalid)('%s ⇒ invalid', (_label, value) => {
    expect(checkOrigin(value, APP)).toEqual({ ok: false, category: 'invalid' });
  });

  it('literal null ⇒ recusa (null)', () => {
    expect(checkOrigin('null', APP)).toEqual({ ok: false, category: 'null' });
  });

  const nonCanonical: Array<[string, string]> = [
    ['com path', 'http://localhost:3000/app'],
    ['barra final', 'http://localhost:3000/'],
    ['userinfo', 'http://user:pw@localhost:3000'],
    ['maiúsculas no host', 'http://LOCALHOST:3000'],
    ['maiúsculas no esquema', 'HTTP://localhost:3000'],
    ['espaço no início', ' http://localhost:3000'],
    ['espaço no fim', 'http://localhost:3000 '],
    ['query', 'http://localhost:3000?x=1'],
    ['fragmento', 'http://localhost:3000#x'],
    ['porta padrão explícita', 'http://localhost:80'],
  ];
  it.each(nonCanonical)('%s ⇒ non_canonical (não aceita nem quando equivale)', (_l, value) => {
    expect(checkOrigin(value, APP)).toEqual({ ok: false, category: 'non_canonical' });
  });

  it('variantes não canônicas da própria APP_ORIGIN também são recusadas', () => {
    expect(checkOrigin('http://localhost:3000/', APP).ok).toBe(false);
    expect(checkOrigin('HTTP://LOCALHOST:3000', APP).ok).toBe(false);
  });
});

describe('AC-15.4: origem divergente', () => {
  const mismatch: Array<[string, string]> = [
    ['esquema (https×http)', 'https://localhost:3000'],
    ['porta', 'http://localhost:3001'],
    ['porta ausente (80×3000)', 'http://localhost'],
    ['host', 'http://127.0.0.1:3000'],
    ['outro domínio', 'http://evil.test:3000'],
    ['subdomínio', 'http://app.localhost:3000'],
  ];
  it.each(mismatch)('%s ⇒ mismatch', (_label, value) => {
    expect(checkOrigin(value, APP)).toEqual({ ok: false, category: 'mismatch' });
  });

  it('esquema divergente com APP_ORIGIN https', () => {
    expect(checkOrigin('http://app.exemplo.test', 'https://app.exemplo.test')).toEqual({
      ok: false,
      category: 'mismatch',
    });
  });

  it('subdomínio e domínio-pai não casam', () => {
    expect(checkOrigin('https://exemplo.test', 'https://app.exemplo.test').ok).toBe(false);
    expect(checkOrigin('https://x.app.exemplo.test', 'https://app.exemplo.test').ok).toBe(false);
  });
});

describe('AC-15.5: esquemas não-http(s)', () => {
  const schemes = [
    'file:///etc/passwd',
    'chrome-extension://abcdefghijklmnop',
    'data:text/html,x',
    'ftp://localhost:3000',
    'javascript:alert(1)',
  ];
  it.each(schemes)('%s ⇒ scheme', (value) => {
    expect(checkOrigin(value, APP)).toEqual({ ok: false, category: 'scheme' });
  });

  it("origem opaca 'null' ⇒ recusa", () => {
    expect(checkOrigin('null', APP).ok).toBe(false);
  });
});

describe('AC-15.6: Host / X-Forwarded-* / Forwarded não influenciam o resultado', () => {
  it('a função recebe só o valor de Origin e nunca consulta cabeçalhos', () => {
    // Prova estática de que o nosso código não os lê: o módulo não cita esses cabeçalhos
    // fora de comentários, e a assinatura não aceita Headers/Request.
    const source = readFileSync(new URL('./origin-check.ts', import.meta.url), 'utf8');
    const code = source
      .split('\n')
      .filter((line) => !/^\s*(\/\*|\*|\/\/)/.test(line))
      .map((line) => line.replace(/\/\/.*$/, ''))
      .join('\n');
    expect(code).not.toMatch(/x-forwarded|forwarded|host/i);
    expect(checkOrigin.length).toBe(2);
  });

  it('mesmas entradas ⇒ mesmo resultado, independentemente de qualquer outro cabeçalho', () => {
    // Cabeçalhos forjados/coincidentes não têm por onde entrar: simulamos o contexto de uma
    // requisição e extraímos só o Origin, como o handler fará.
    const forged = new Headers({
      origin: 'http://evil.test',
      host: 'localhost:3000',
      'x-forwarded-host': 'localhost:3000',
      'x-forwarded-proto': 'http',
      forwarded: 'host=localhost:3000;proto=http',
    });
    expect(checkOrigin(forged.get('origin'), APP)).toEqual({ ok: false, category: 'mismatch' });

    const matching = new Headers({
      origin: 'http://localhost:3000',
      host: 'evil.test',
      'x-forwarded-host': 'evil.test',
      'x-forwarded-proto': 'https',
      forwarded: 'host=evil.test;proto=https',
    });
    expect(checkOrigin(matching.get('origin'), APP)).toEqual({ ok: true });
  });

  it('Headers com Origin repetido chega como lista separada por vírgula ⇒ invalid', () => {
    const headers = new Headers();
    headers.append('origin', 'http://localhost:3000');
    headers.append('origin', 'http://evil.test');
    expect(checkOrigin(headers.get('origin'), APP)).toEqual({ ok: false, category: 'invalid' });
  });
});

describe('APP_ORIGIN inválida ⇒ falha fechada (category config)', () => {
  const badConfigs: Array<string | undefined> = [
    undefined,
    '',
    'localhost',
    'ftp://localhost:3000',
    'http://localhost:3000/app',
    'http://localhost:3000?x=1',
    'http://user:pw@localhost:3000',
  ];
  it.each(badConfigs)('%s', (config) => {
    // mesmo com um Origin "perfeito", nada é aceito
    expect(checkOrigin('http://localhost:3000', config)).toEqual({
      ok: false,
      category: 'config',
    });
  });
});
