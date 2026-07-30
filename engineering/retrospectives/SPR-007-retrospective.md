# SPR-007 — Retrospectiva Técnica

Data: 30/07/2026

---

# Objetivo

Registrar aprendizados técnicos da sprint para melhorar o processo de engenharia do Content-OS.

---

# O que funcionou bem

- Design Document evitou retrabalho.
- ADR-002 definiu claramente a arquitetura.
- Implementação seguiu o Design Freeze.
- Swagger integrado com sucesso.
- JWT implementado conforme planejado.
- Refresh Token funcionando.
- Testes unitários e E2E criados.
- Patch incremental facilitou correções.

---

# Problemas encontrados

## 1. Configuração do ambiente

Foi necessário criar:

- .env
- .env.test

Inicialmente isso não estava documentado.

Impacto:

- aplicação não iniciava
- testes falhavam

---

## 2. Jest

Foi necessário ajustar:

test/jest-e2e.json

para localizar corretamente o env-setup.ts.

---

## 3. Prisma

Foi necessário executar:

pnpm exec prisma generate

antes dos testes.

Esse passo deve fazer parte do checklist oficial.

---

## 4. Docker

Os testes dependem do PostgreSQL em execução.

Docker Desktop precisa estar iniciado.

---

# O que deve mudar para a próxima sprint

Adicionar ao README:

- como subir ambiente
- como executar migrations
- como gerar Prisma Client
- como executar testes
- como iniciar Swagger

---

Criar checklist oficial de validação.

---

# Checklist oficial da sprint

- pnpm install
- prisma generate
- migrate dev
- lint
- unit tests
- e2e tests
- build
- start:dev
- validar Swagger

---

# Dívida técnica

Nenhuma.

---

# Decisões confirmadas

- JWT
- Refresh Token
- Guard Global
- Swagger Bearer
- Validation do ambiente

Todas permanecem válidas.

---

# Resultado

SPR-007 aprovada.

Pronta para merge.
