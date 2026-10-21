/**
 * Mensagens de interface do Bloco A — LISTA FECHADA (ADR-014 §7; AC-32).
 *
 * Regras: nenhuma afirma revogação remota nem diz "nada foi revogado";
 * nenhuma contém token, stack, `path` ou `message` crua da API. Textos de
 * outras telas (B1/C) entram nos seus blocos.
 */

export const MESSAGES = {
  /** Login `401`. */
  loginInvalidCredentials: 'E-mail ou senha inválidos.',
  /** Login `400`. */
  loginInvalidData: 'Dados inválidos.',
  /** Login com API indisponível. */
  serviceUnavailable: 'Serviço indisponível. Tente novamente.',
  /** Logout, mensagem A: não afirma revogação. */
  logoutA: 'Você saiu.',
  /** Logout, mensagem B: encerramento no servidor não confirmado. */
  logoutB:
    'Você saiu deste dispositivo. Não foi possível confirmar o encerramento da sessão no servidor.',
} as const;

export type MessageKey = keyof typeof MESSAGES;

export function messageFor(key: MessageKey): string {
  return MESSAGES[key];
}
