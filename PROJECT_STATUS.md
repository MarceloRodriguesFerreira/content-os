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

**SPR-012 — Domínio: Campaign — ✅ Concluída**
Status:
✅ `ADR-011-campaign-ownership-authorization.md` em `Status: Accepted`
✅ Bloco A (Persistência) — aprovado e mergeado (PR #17, commit `c2eaf5f`)
✅ Bloco B (Regras de Negócio e Autorização) — aprovado e mergeado (PR #18, commit `fb92c6b`)
✅ Bloco C (API REST) — aprovado e mergeado (PR #19, commit `21d154a`)

Diferente das SPR-008/009/010, esta sprint não possui um Design Document dedicado em
`engineering/designs/SPR-012-*.md` — a decisão de arquitetura está registrada exclusivamente na
`ADR-011`. Por isso, não se afirma aqui um "Design Freeze" formal no sentido pleno já usado nas
sprints anteriores (ADR + Design Doc); o que está confirmado é: `ADR-011` em `Accepted`, e os
três blocos (Persistência, Regras de Negócio e Autorização, API REST) aprovados e mergeados em
`main`.

Governança resolvida no encerramento: `ADR-011` segue em `Status: Accepted` (já promovida antes
do encerramento formal). `engineering/backlog/SPR-012.md` criado retroativamente durante o
encerramento, como registro documental de encerramento — não como Design Document.

`Campaign` é o primeiro agregado filho de `Project`: não possui `ownerId` próprio, com
propriedade derivada de `Campaign.projectId → Project.ownerId`. `CampaignOwnershipGuard` é
específico do módulo `campaigns` (sem abstração compartilhada com `ProjectOwnershipGuard` —
decisão YAGNI registrada em `ADR-011`), e falhas de ownership de `Campaign` retornam sempre
`404 Not Found` (divergência consciente e localizada em relação à `ADR-009`, que permanece
integralmente válida para `Project`).

SPR-010 (Governança do Prisma Client + CI) segue ✅ **Concluída** — ver "Último Marco" abaixo
para o histórico completo.

Última atualização:

**24/08/2026**

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
| CI/CD | ✅ CI operacional (GitHub Actions, PR + push em `main`); CD fora de escopo |
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
| SPR-010 | Governança do Prisma Client + CI | ✅ |
| SPR-012 | Domínio: Campaign (`Campaign`, API REST) | ✅ |

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

## ✅ SPR-012 — Domínio: Campaign concluída

### Principais entregas

- `ADR-011-campaign-ownership-authorization.md`: primeiro agregado filho de `Project` sem
  `ownerId` próprio — ownership derivada de `Campaign.projectId → Project.ownerId`
- `CampaignsRepository`, `CampaignsService`, `CampaignOwnershipGuard`, `CampaignsController`
  sob `/v1/projects/:projectId/campaigns` (Blocos A, B e C)
- `CampaignOwnershipGuard` específico do módulo (YAGNI — sem abstração compartilhada com
  `ProjectOwnershipGuard`); falhas de ownership retornam sempre `404 Not Found`, incluindo
  proteção contra IDOR em rotas com `:projectId` + `:id` (divergência consciente e localizada em
  relação à `ADR-009`, que permanece válida para `Project`)
- `engineering/backlog/SPR-012.md` criado retroativamente durante o encerramento formal
- `engineering/runbooks/sprint-closure.md` aplicado pela terceira vez

Marco anterior: SPR-010 (Governança do Prisma Client + CI) — ver `CHANGELOG.md` para o
histórico completo de entregas por sprint.

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

Nenhuma sprint em andamento no momento — SPR-012 foi concluída (ver "Último Marco" acima) e a
próxima ainda não foi definida. Ver seção "Próxima Sprint" abaixo para as trilhas registradas no
backlog.

**Release:** não atribuída antecipadamente (ver convenção em `VISION.md`, seção "Roadmap
Estratégico"). SPR-008 (RBAC, HTTP Pipeline, Versionamento), SPR-009 (Domínio: Projetos),
SPR-010 (Governança do Prisma Client + CI) e SPR-012 (Domínio: Campaign) seguem em `[Unreleased]`
no `CHANGELOG.md`, sem tag cortada desde a `0.2.0`. A versão real será definida no momento em que
uma release for de fato marcada, podendo agrupar as sprints em uma única release ou não — decisão
de release, não de roadmap.

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
| Domínio de Negócio (Campaign) | ✅ |
| CI/CD | ✅ CI operacional (GitHub Actions, PR + push em `main`); CD fora de escopo |

---

# Próxima Sprint

SPR-012 (Domínio: Campaign) foi concluída — ver "Último Marco" acima. A próxima sprint ainda não
foi definida.

**Nota sobre SPR-011:** o endpoint público de registro de usuários já foi mergeado em `main`
(commit `a12eaca`, PR #16) e não é mais uma trilha candidata em aberto. A regularização
documental completa da SPR-011 (backlog dedicado, encerramento formal) está fora do escopo deste
documento e será tratada separadamente.

---

# Pendências Conhecidas (não bloqueantes)

- Definir estratégia de registro de usuários — não tratado na SPR-008 nem na SPR-009; retomado
  junto do fluxo de onboarding de usuários (candidata a SPR-011).
- Modelo de Roles definido em `ADR-004` (papel único, sem Permissions/Claims — não é mais
  pendência de definição; Permissions/Claims permanecem fora de escopo até haver gatilho real,
  ver "Future Evolution" da `ADR-004`).
- `TECH-001` não é mais pendência — resolvida via `ADR-006` e `.github/workflows/ci.yml`
  (SPR-010).
