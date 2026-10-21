import { describe, expect, it } from 'vitest';
import { parseEnvelope } from './envelope';

describe('parseEnvelope (AC-05)', () => {
  it('200 com envelope de sucesso', () => {
    const body = JSON.stringify({ success: true, data: { id: 1 }, timestamp: 't' });
    expect(parseEnvelope(200, body)).toEqual({
      kind: 'success',
      status: 200,
      data: { id: 1 },
    });
  });

  it('201 com envelope de sucesso', () => {
    const body = JSON.stringify({ success: true, data: { name: 'p' } });
    expect(parseEnvelope(201, body)).toMatchObject({ kind: 'success', status: 201 });
  });

  it('204 sem corpo', () => {
    expect(parseEnvelope(204, null)).toEqual({ kind: 'no_content', status: 204 });
    expect(parseEnvelope(204, '')).toEqual({ kind: 'no_content', status: 204 });
  });

  it('erro com message string', () => {
    const body = JSON.stringify({
      success: false,
      error: { statusCode: 401, error: 'Unauthorized', message: 'Credenciais inválidas' },
      path: '/v1/auth/login',
    });
    expect(parseEnvelope(401, body)).toEqual({
      kind: 'error',
      status: 401,
      messages: ['Credenciais inválidas'],
      wellFormed: true,
    });
  });

  it('erro com message array', () => {
    const body = JSON.stringify({
      success: false,
      error: { statusCode: 400, error: 'Bad Request', message: ['name must be a string', 'x'] },
    });
    expect(parseEnvelope(400, body)).toEqual({
      kind: 'error',
      status: 400,
      messages: ['name must be a string', 'x'],
      wellFormed: true,
    });
  });

  it('2xx com corpo ilegível ou fora da forma ⇒ unavailable', () => {
    expect(parseEnvelope(200, '<html>oops</html>')).toEqual({ kind: 'unavailable' });
    expect(parseEnvelope(200, '{"success":true')).toEqual({ kind: 'unavailable' });
    expect(parseEnvelope(200, '')).toEqual({ kind: 'unavailable' });
    expect(parseEnvelope(200, null)).toEqual({ kind: 'unavailable' });
    expect(parseEnvelope(200, '[1,2]')).toEqual({ kind: 'unavailable' });
    expect(parseEnvelope(200, '{"success":true}')).toEqual({ kind: 'unavailable' });
    expect(parseEnvelope(200, '{"success":false,"data":1}')).toEqual({ kind: 'unavailable' });
  });

  it('4xx/5xx fora do envelope ⇒ error sem mensagens e wellFormed=false', () => {
    expect(parseEnvelope(500, 'Internal Server Error')).toEqual({
      kind: 'error',
      status: 500,
      messages: [],
      wellFormed: false,
    });
    const badMessage = JSON.stringify({
      success: false,
      error: { statusCode: 400, message: [1, 2] },
    });
    expect(parseEnvelope(400, badMessage)).toMatchObject({ wellFormed: false, messages: [] });
  });

  it('status inesperado (1xx/3xx) ⇒ unavailable', () => {
    expect(parseEnvelope(302, null)).toEqual({ kind: 'unavailable' });
    expect(parseEnvelope(101, null)).toEqual({ kind: 'unavailable' });
  });

  it('nunca devolve o corpo bruto', () => {
    const secret = 'SEGREDO-NO-CORPO';
    const result = parseEnvelope(200, `não é json ${secret}`);
    expect(JSON.stringify(result)).not.toContain(secret);
    const err = parseEnvelope(500, `html ${secret}`);
    expect(JSON.stringify(err)).not.toContain(secret);
  });
});
