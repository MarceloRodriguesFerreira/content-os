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

**SPR-010 — Governança do Prisma Client + CI — 🟡 Bloco B implementado, aguardando aprovação
(sprint ainda não encerrada)**
Status:
✅ `ADR-006` e `SPR-010-infra-tooling.md` — Design Freeze aprovado
✅ Bloco A (Governança e Preparação) — aprovado e mergeado
🟡 Bloco B (CI) — implementado (`.github/workflows/ci.yml`); lint, testes unitários, build,
migrations e E2E validados localmente; mecanismo de sincronização do Prisma (`ADR-006`) validado
nos cenários positivo e negativo; aguardando aprovação e merge

`ADR-006` segue com `Status: Proposed` — só é promovida a `Accepted` no encerramento formal da
sprint (mesmo fluxo de governança já usado nas demais ADRs, não antecipado por bloco). `TECH-001`
segue `Status: Em andamento` pelo mesmo motivo — a resolução definitiva ainda depende do merge do
Bloco B em `main`.

Esta sprint implementa apenas Continuous Integration — CD/deploy automático permanece
explicitamente fora de escopo (ver `SPR-010-infra-tooling.md`). A CI produz um sinal
verde/vermelho; o bloqueio efetivo de merge depende de branch protection, configuração posterior
e manual do Arquiteto-Chefe no GitHub, fora do que este patch consegue implementar.

SPR-009 (Domínio: Projetos) segue ✅ **Concluída** — ver "Último Marco" abaixo para o histórico
completo.

Última atualização:

**10/08/2026**

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
| CI/CD | 🟡 CI implementado, aguardando aprovação (CD fora de escopo) |
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

SPR-010 (Governança do Prisma Client + CI) em andamento — Bloco A implementado, aguardando
aprovação; Bloco B (CI) ainda não iniciado. Ver "Sprint Atual" acima.

**Release:** não atribuída antecipadamente (ver convenção em `VISION.md`, seção "Roadmap
Estratégico"). SPR-008 (RBAC, HTTP Pipeline, Versionamento) e SPR-009 (Domínio: Projetos) ambas
seguem em `[Unreleased]` no `CHANGELOG.md`, sem tag cortada desde a `0.2.0`. A versão real será
definida no momento em que uma release for de fato marcada, podendo agrupar as sprints em uma
única release ou não — decisão de release, não de roadmap.

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
| CI/CD | 🟡 CI implementado, aguardando aprovação (CD fora de escopo) |

---

# Próxima Sprint

SPR-011 (candidata: registro público de usuários) e SPR-012 (candidata: `Campaign`) ainda não têm
Design Freeze — ver análise de planejamento correspondente. Duas trilhas permanecem registradas
no backlog, deliberadamente fora do escopo da SPR-010 (decisão do Arquiteto-Chefe):

- Endpoint público de registro de usuários (domínio de autenticação, a ser retomado quando o
  fluxo de onboarding de usuários for iniciado)
- Domínio `Campaign` (evolução do agregado `Project`, ver `VISION.md`)

---

# Pendências Conhecidas (não bloqueantes)

- Definir estratégia de registro de usuários — não tratado na SPR-008 nem na SPR-009; retomado
  junto do fluxo de onboarding de usuários (candidata a SPR-011).
- Modelo de Roles definido em `ADR-004` (papel único, sem Permissions/Claims — não é mais
  pendência de definição; Permissions/Claims permanecem fora de escopo até haver gatilho real,
  ver "Future Evolution" da `ADR-004`).
- `TECH-001`: `Status: Em andamento` — decisão arquitetural formalizada em `ADR-006` (SPR-010,
  Bloco A), mas a resolução definitiva ainda depende da aprovação da ADR (`Status: Proposed`
  hoje) e da implementação do Bloco B (CI), que ainda não foi iniciado.
