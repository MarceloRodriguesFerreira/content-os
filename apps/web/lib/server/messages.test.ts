import { describe, expect, it } from 'vitest';
import { MESSAGES, messageFor, type MessageKey } from './messages';

const entries = Object.entries(MESSAGES) as Array<[MessageKey, string]>;

describe('AC-32: mensagens de lista fechada', () => {
  it('contém exatamente as mensagens documentadas', () => {
    expect(MESSAGES).toEqual({
      loginInvalidCredentials: 'E-mail ou senha inválidos.',
      loginInvalidData: 'Dados inválidos.',
      serviceUnavailable: 'Serviço indisponível. Tente novamente.',
      logoutA: 'Você saiu.',
      logoutB:
        'Você saiu deste dispositivo. Não foi possível confirmar o encerramento da sessão no servidor.',
    });
  });

  it.each(entries)('%s não afirma revogação', (_key, text) => {
    expect(text).not.toMatch(/revogad/i);
    expect(text).not.toMatch(/nada foi revogado/i);
  });

  it.each(entries)('%s não expõe token, stack, path ou mensagem crua da API', (_key, text) => {
    expect(text).not.toMatch(/token|bearer|jwt|cos_(access|refresh)/i);
    expect(text).not.toMatch(/stack|\bat .*\(.*:\d+:\d+\)/i);
    expect(text).not.toMatch(/\/v1\/|\/api\/|statusCode|Unauthorized|Bad Request|Internal Server/i);
    expect(text).not.toMatch(/https?:\/\//i);
  });

  it('cada mensagem é texto curto em uma linha', () => {
    for (const [, text] of entries) {
      expect(text.trim()).toBe(text);
      expect(text).not.toContain('\n');
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('messageFor devolve o texto da chave', () => {
    expect(messageFor('logoutA')).toBe('Você saiu.');
    expect(messageFor('logoutB')).toBe(MESSAGES.logoutB);
  });
});
