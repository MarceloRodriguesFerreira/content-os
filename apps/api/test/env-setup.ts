/**
 * Bootstrap de ambiente exclusivo para os testes E2E.
 *
 * Contexto (hotfix pós-SPR-007): `AppConfigModule` carrega variáveis de
 * ambiente apenas a partir de arquivos `.env` (cwd e raiz do monorepo) —
 * não existe hoje um mecanismo dedicado de ambiente para testes. Isso
 * sempre fez os testes E2E dependerem implicitamente do `.env` pessoal do
 * desenvolvedor. Com o SPR-007 tornando `JWT_SECRET`, `JWT_ACCESS_TTL` e
 * `JWT_REFRESH_TTL` obrigatórios em `env.validation.ts`, o bootstrap da
 * aplicação passou a falhar em qualquer ambiente limpo (CI, clone novo)
 * que não possua essas variáveis.
 *
 * Este arquivo é registrado em `setupFiles` no `jest-e2e.json`, portanto
 * roda antes de qualquer módulo de teste ser carregado — em particular,
 * antes do `Test.createTestingModule({ imports: [AppModule] })` disparar
 * a validação do `ConfigModule`.
 *
 * Não usa nenhuma dependência nova: apenas um parser mínimo de arquivo
 * `.env` (formato `CHAVE=valor`, comentários com `#`, uma variável por
 * linha), suficiente para o único propósito deste arquivo.
 *
 * Variáveis já presentes em `process.env` (ex.: exportadas pelo CI) nunca
 * são sobrescritas — este script apenas preenche o que estiver faltando.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, 'utf-8');

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(__dirname, '.env.test'));
