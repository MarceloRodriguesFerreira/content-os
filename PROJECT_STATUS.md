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

**SPR-013 — Domínio: Content — ✅ Concluída**
Status:
✅ `ADR-012-content-ownership-authorization.md` em `Status: Accepted`
✅ `engineering/designs/SPR-013-content-domain.md` em `Status: Accepted`
✅ Bloco A (Persistência) — aprovado e mergeado (PR #22, commit `8df7f44`)
✅ Bloco B (Regras de Negócio e Autorização) — aprovado e mergeado (PR #24, commit `2a85565`)
✅ Bloco C (API REST) — aprovado e mergeado (PR #25, commit de correção `6028834`, merge
`419a8a5`)

Diferente da SPR-012, esta sprint possui um Design Document dedicado
(`engineering/designs/SPR-013-content-domain.md`), seguindo o mesmo padrão pleno de "Design
Freeze" (ADR + Design Doc) já usado nas SPR-008/009/010. Ambos os documentos estão em
`Status: Accepted`, e os três blocos (Persistência, Regras de Negócio e Autorização, API REST)
foram aprovados e mergeados em `main`.

Governança resolvida no encerramento: `ADR-012` e o Design Doc seguem em `Status: Accepted` (já
promovidos antes do encerramento formal, na PR #23). `engineering/backlog/SPR-013.md` atualizado
durante o encerramento, registrando os três blocos como concluídos.

`Content` é o primeiro agregado filho de `Campaign` — e o primeiro recurso de terceiro nível do
Content-OS (neto de `Project`): não possui `ownerId` próprio, com propriedade derivada de
`Content.campaignId → Campaign.projectId → Project.ownerId`. `ContentOwnershipGuard` é
específico do módulo `content` (sem abstração compartilhada com
`ProjectOwnershipGuard`/`CampaignOwnershipGuard` — decisão YAGNI registrada em `ADR-012`), cobre
explicitamente os dois contextos de rota (com `:id` e sem `:id`, em `create`/`list`), e falhas de
ownership retornam sempre `404 Not Found` (divergência consciente e localizada em relação à
`ADR-009`, já aplicada por `CampaignOwnershipGuard` via `ADR-011`).

SPR-012 (Domínio: Campaign) segue ✅ **Concluída** — ver "Sprints Concluídas" e "Último Marco"
abaixo para o histórico completo.

Última atualização:

**23/09/2026**

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
| SPR-013 | Domínio: Content (`Content`, API REST) | ✅ |

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

## ✅ SPR-013 — Domínio: Content concluída

### Principais entregas

- `ADR-012-content-ownership-authorization.md` e `engineering/designs/SPR-013-content-domain.md`:
  primeiro agregado de terceiro nível (neto de `Project`, filho de `Campaign`) sem `ownerId`
  próprio — ownership derivada de `Content.campaignId → Campaign.projectId → Project.ownerId`
- `ContentsRepository`, `ContentsService`, `ContentOwnershipGuard`, `ContentsController` sob
  `/v1/campaigns/:campaignId/contents` (Blocos A, B e C)
- `ContentOwnershipGuard` específico do módulo (YAGNI — sem abstração compartilhada com
  `ProjectOwnershipGuard`/`CampaignOwnershipGuard`); cobre explicitamente os dois contextos de
  rota (com `:id`, e sem `:id` em `create`/`list`, auditado e confirmado no encerramento do
  Bloco C); falhas de ownership retornam sempre `404 Not Found`, incluindo proteção contra IDOR
  em rotas com `:campaignId` + `:id` — tanto entre usuários diferentes quanto com `:campaignId`
  de outra campanha do próprio usuário (divergência consciente e localizada em relação à
  `ADR-009`, que permanece válida para `Project`)
- `engineering/backlog/SPR-013.md` atualizado durante o encerramento formal
- `engineering/runbooks/sprint-closure.md` aplicado pela quarta vez

Marco anterior: SPR-012 (Domínio: Campaign) — ver `CHANGELOG.md` para o histórico completo de
entregas por sprint.

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

Nenhuma sprint em andamento no momento — SPR-013 foi concluída (ver "Último Marco" acima) e a
próxima ainda não foi definida. Ver seção "Próxima Sprint" abaixo para as trilhas registradas no
backlog.

**Release:** não atribuída antecipadamente (ver convenção em `VISION.md`, seção "Roadmap
Estratégico"). SPR-008 (RBAC, HTTP Pipeline, Versionamento), SPR-009 (Domínio: Projetos),
SPR-010 (Governança do Prisma Client + CI), SPR-012 (Domínio: Campaign) e SPR-013 (Domínio:
Content) seguem em `[Unreleased]` no `CHANGELOG.md`, sem tag cortada desde a `0.2.0`. A versão
real será definida no momento em que uma release for de fato marcada, podendo agrupar as sprints
em uma única release ou não — decisão de release, não de roadmap.

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
| Domínio de Negócio (Content) | ✅ |
| CI/CD | ✅ CI operacional (GitHub Actions, PR + push em `main`); CD fora de escopo |

---

# Próxima Sprint

SPR-013 (Domínio: Content) foi concluída — ver "Último Marco" acima. A próxima sprint ainda não
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
