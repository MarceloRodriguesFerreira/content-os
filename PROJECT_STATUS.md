# 🚀 Content-OS

> Plataforma inteligente para criação, organização e publicação de conteúdo para redes sociais utilizando Inteligência Artificial.

---

# Documentação Oficial

| Documento | Finalidade |
|-----------|------------|
| README.md | Instalação, configuração e execução do projeto |
| VISION.md | Visão do produto e roadmap estratégico |
| ARCHITECTURE.md | Arquitetura oficial do sistema |
| PROJECT_STATUS.md | Estado atual do desenvolvimento |
| CHANGELOG.md | Histórico de releases |
| CONTRIBUTING.md | Guia de contribuição |
| ENGINEERING_GUIDE.md | Processo oficial de engenharia |
| engineering/ | ADRs, Design Docs, Runbooks, Standards, Templates, Checklists e Retrospectives |

---

# Status do Projeto

## Versão Atual

**0.2.0**

## Status

🟢 Em Desenvolvimento

## Sprint Atual

**SPR-009 — Domínio: Projetos — ✅ Concluída**
Status:
✅ `ADR-008`, `ADR-009`, `ADR-010` e `SPR-009-projects-domain.md` — Design Freeze aprovado e mergeado
✅ Bloco A (Persistência) — aprovado e mergeado
✅ Bloco B (Regras de Negócio e Autorização) — aprovado e mergeado
✅ Bloco C (API REST) — aprovado e mergeado; lint, testes unitários, build e E2E verdes

Governança das ADRs resolvida no encerramento: `ADR-008`, `ADR-009` e `ADR-010`, e o design doc
`SPR-009-projects-domain.md`, foram promovidos de `Status: Proposed` para `Status: Accepted`,
seguindo a convenção já em uso no repositório para toda decisão implementada e mergeada (mesmo
padrão de `ADR-001`, `ADR-002`, `ADR-003`, `ADR-004`, `ADR-005`, `ADR-007` e dos três design docs
de bloco da SPR-008). Procedimento de encerramento formalizado pela primeira vez em
`engineering/runbooks/sprint-closure.md`.

SPR-008 (Autorização RBAC e HTTP Pipeline) está ✅ **Concluída** — Blocos A, B e C aprovados e
mergeados.

Dívida técnica registrada (fora de escopo desta e da sprint anterior, encaminhada): `TECH-001` —
versionamento do Prisma Client gerado. Ver `engineering/tech-debt/` e
`engineering/backlog/infra-backlog.md`.

Última atualização:

**07/08/2026**

---

# Stack Oficial

## Frontend

- Next.js
- React
- TypeScript

## Backend

- NestJS 11
- TypeScript

## Banco de Dados

- PostgreSQL

## ORM

- Prisma 7

## Monorepo

- Turborepo
- pnpm

## Containers

- Docker

---

# Estado da Plataforma

| Camada | Status |
|---------|--------|
| Frontend | ✅ Operacional |
| Backend | ✅ Operacional |
| PostgreSQL | ✅ Operacional |
| Prisma ORM | ✅ Operacional |
| Configuração Centralizada | ✅ Operacional |
| Persistência | ✅ Operacional |
| Swagger/OpenAPI | ✅ Operacional |
| Autenticação JWT | ✅ Operacional |
| Testes Unitários | ✅ Operacional |
| Testes E2E | ✅ Operacional |
| Build | ✅ Operacional |
| Lint | ✅ Operacional |
| CI/CD | ⬜ Planejado |
| Deploy | ⬜ Planejado |

---

# Sprints Concluídas

| Sprint | Entrega | Status |
|---------|----------|--------|
| SPR-001 | Fundação do Projeto | ✅ |
| SPR-002 | Infraestrutura Inicial | ✅ |
| SPR-003 | Configuração Centralizada | ✅ |
| SPR-004 | Fundação de Persistência (Prisma) | ✅ |
| SPR-005 | Swagger / OpenAPI | ✅ |
| SPR-006 | Design da Segurança + ADR-002 | ✅ |
| SPR-007 | Camada de Autenticação JWT | ✅ |
| SPR-009 | Domínio: Projetos (`Project`, API REST) | ✅ |

---

# Funcionalidades Concluídas

## Fundação

- ✅ Monorepo (Turborepo + pnpm)
- ✅ Frontend Next.js
- ✅ Backend NestJS
- ✅ Docker Compose
- ✅ PostgreSQL
- ✅ Prisma ORM
- ✅ Primeira Migration
- ✅ Configuração Centralizada (AppConfigModule / AppConfigService)
- ✅ Fundação de Persistência
- ✅ Graceful Shutdown
- ✅ Logging do Prisma
- ✅ Testes Unitários
- ✅ Testes E2E

---

## Documentação da API (SPR-005)

- ✅ Swagger configurado
- ✅ OpenAPI 3
- ✅ `/api/docs`
- ✅ `/api/docs-json`
- ✅ Versionamento inicial
- ✅ Organização por Tags
- ✅ DTOs documentados
- ✅ Responses documentadas

---

## Segurança (SPR-006 + SPR-007)

- ✅ AuthModule
- ✅ UsersModule
- ✅ Login JWT
- ✅ Refresh Token
- ✅ Logout
- ✅ Rotação de Refresh Token
- ✅ Detecção de Reuso
- ✅ Refresh Token Hash (SHA-256)
- ✅ Bcrypt
- ✅ Guard Global
- ✅ Decorator @Public()
- ✅ Decorator @CurrentUser()
- ✅ Bearer Authentication no Swagger
- ✅ Estratégia JWT
- ✅ Testes Unitários
- ✅ Testes E2E

---

# SPR-005 — Backlog (Concluído)

## Objetivo

Implantar a documentação oficial da API utilizando Swagger/OpenAPI.

### Entregas

- [x] Swagger
- [x] OpenAPI
- [x] DTOs
- [x] Responses
- [x] Versionamento
- [x] Ambiente `/api/docs`

---

# SPR-007 — Backlog (Concluído)

## Objetivo

Implementar a camada completa de autenticação seguindo a ADR-002.

### Entregas

- [x] JWT
- [x] Refresh Token
- [x] Rotação
- [x] Detecção de Reuso
- [x] Guard Global
- [x] AuthModule
- [x] UsersModule
- [x] Estratégia JWT
- [x] Bearer Authentication
- [x] Testes Unitários
- [x] Testes E2E

### Pendências Registradas

- Endpoint de registro de usuários.
- ValidationPipe Global.

---

# Developer Experience

Planejado

- [ ] pnpm setup
- [ ] pnpm check
- [ ] pnpm quality
- [ ] pnpm reset

---

# Último Marco

## ✅ SPR-009 — Domínio: Projetos concluída

### Principais entregas

- Primeiro agregado de negócio do Content-OS: `Project`
- `ProjectsRepository` (Repository Pattern), `ProjectsService`, `ProjectOwnershipGuard`
- DTOs de entrada/saída, `PaginatedResponseDto` genérico compartilhado (`ADR-010`)
- `ProjectsController` sob `/v1/projects` (criação, listagem paginada/filtrada, detalhe,
  atualização parcial, arquivamento e restauração)
- Autorização por propriedade de recurso (`ADR-009`) — dono ou `ADMIN`/`SUPER_ADMIN`
- Documentação Swagger completa (tag `Projects`)
- Testes Unitários e End-to-End (fluxo completo, isolamento entre usuários, acesso
  administrativo, paginação, validação, conflito de estado)

Marco anterior: SPR-007 (Camada de Autenticação JWT) — ver `CHANGELOG.md` para o histórico
completo de entregas por sprint.

---

# Lições Aprendidas

## Configuração

- O carregamento do `.env` deve considerar ambientes distintos (desenvolvimento, testes e produção).
- Em monorepos, o `process.cwd()` varia conforme o comando executado.

## Prisma

- Sempre regenerar o Prisma Client após alterações no schema.
- Migrations devem fazer parte da entrega da sprint.

## Testes

- O ambiente de testes deve possuir configuração própria (`.env.test`).
- E2E não deve depender do `.env` de desenvolvimento.

## Segurança

- Toda rota deve ser protegida por padrão.
- Apenas rotas explicitamente marcadas com `@Public()` permanecem públicas.

---

# Próximo Marco

Nenhuma sprint em andamento no momento — SPR-009 foi concluída (ver "Último Marco" acima) e a
próxima ainda não foi definida. Ver seção "Próxima Sprint" abaixo para as trilhas registradas no
backlog.

**Release:** não atribuída antecipadamente (ver convenção em `VISION.md`, seção "Roadmap
Estratégico"). SPR-008 (RBAC, HTTP Pipeline, Versionamento) e SPR-009 (Domínio: Projetos) ambas
seguem em `[Unreleased]` no `CHANGELOG.md`, sem tag cortada desde a `0.2.0`. A versão real será
definida no momento em que uma release for de fato marcada, podendo agrupar as duas sprints em
uma única release ou não — decisão de release, não de roadmap.

---

# Indicadores Técnicos

| Indicador | Situação |
|-----------|----------|
| TypeScript | ✅ |
| NestJS | ✅ |
| Prisma | ✅ |
| PostgreSQL | ✅ |
| Docker | ✅ |
| Configuração Centralizada | ✅ |
| Persistência | ✅ |
| Testes Unitários | ✅ |
| Testes E2E | ✅ |
| Build | ✅ |
| Lint | ✅ |
| Swagger | ✅ |
| Autenticação JWT | ✅ |
| Autorização (RBAC) | ✅ |
| HTTP Pipeline (Validation/Exception/Response) | ✅ |
| Versionamento de API | ✅ |
| Domínio de Negócio (Projetos) | ✅ |
| CI/CD | ⬜ |

---

# Próxima Sprint

Ainda não definida. Três trilhas permanecem registradas no backlog, deliberadamente fora da
SPR-009 (decisão do Arquiteto-Chefe), cada uma pertencendo a uma frente distinta de evolução:

- `TECH-001`/`ADR-006` — política de versionamento de artefatos gerados (infra, ver
  `engineering/backlog/infra-backlog.md`)
- Endpoint público de registro de usuários (domínio de autenticação, a ser retomado quando o
  fluxo de onboarding de usuários for iniciado)
- Pipeline de CI/CD (DevOps/Plataforma, após consolidar a arquitetura funcional do produto)

---

# Pendências Conhecidas (não bloqueantes)

- Definir estratégia de registro de usuários — não tratado na SPR-008 nem na SPR-009; retomado
  junto do fluxo de onboarding de usuários.
- Modelo de Roles definido em `ADR-004` (papel único, sem Permissions/Claims — não é mais
  pendência de definição; Permissions/Claims permanecem fora de escopo até haver gatilho real,
  ver "Future Evolution" da `ADR-004`).
- Estruturar pipeline de CI/CD.
- `TECH-001`: revisar estratégia de versionamento do Prisma Client gerado (`apps/api/generated/`)
  — adiado para sprint própria de infraestrutura, ver `engineering/backlog/infra-backlog.md`.
