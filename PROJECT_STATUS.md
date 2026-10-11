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

**SPR-014 — Domínio: Publication — ✅ Concluída**
Status:
✅ `ADR-013-publication-domain-and-ownership-strategy.md` em `Status: Accepted`
✅ `engineering/designs/SPR-014-publication-domain.md` em `Status: Accepted`
✅ Bloco A (Persistência) — aprovado e mergeado (PR #29, commit `19a768e`, merge `955bb88`)
✅ Bloco B (Regras de Negócio) — aprovado e mergeado (PR #30, commit `24c12bd`, merge `a83effb`)
✅ Bloco C (API REST) — aprovado e mergeado (PR #31, commit `94b3411`, merge `3ab688c`)

Mesmo padrão pleno de "Design Freeze" (ADR + Design Doc) já usado nas SPR-008/009/010/013. Ambos
os documentos estão em `Status: Accepted`, e os três blocos (Persistência, Regras de Negócio,
API REST) foram aprovados e mergeados em `main`.

Governança resolvida no encerramento: `ADR-013` e o Design Doc promovidos para `Status: Accepted`
durante este encerramento formal — convenção aplicada por amostragem de todas as ADRs/Design
Docs anteriores (11 de 11 ADRs já implementadas, e 6 de 7 Design Docs de sprints encerradas,
usam `Accepted`; a única exceção, `SPR-008-validation-pipeline.md` em `Proposed`, é resíduo de
sprint anterior e não foi alterada — fora do escopo deste encerramento).
`engineering/backlog/SPR-014.md` atualizado durante o encerramento, registrando os três blocos
como concluídos.

`Publication` é o quarto agregado do domínio e o primeiro recurso de quarto nível do Content-OS
(bisneto de `Project`, filho de `Content`): não possui `ownerId` próprio, com propriedade
derivada de `Publication.contentId → Content.campaignId → Campaign.projectId → Project.ownerId`.
`PublicationOwnershipGuard` é específico do módulo `publication` (sem abstração compartilhada
com os três guards anteriores — decisão YAGNI reavaliada e deliberadamente adiada pela quarta
vez, registrada em `ADR-013`); diferente de `ContentOwnershipGuard`, `:contentId` é sempre
validado incondicionalmente (não só quando `:id` está presente), já que a rota de Publication
sempre o carrega, inclusive em `create`/`list`. Falhas de ownership retornam sempre
`404 Not Found`. Lifecycle `DRAFT ⇄ SCHEDULED` — sem `PUBLISHED`/`FAILED`/`RETRYING`, sem
scheduler/worker/fila, sem integração externa (Instagram/Meta/OAuth) nesta sprint; `scheduledAt`
é puramente dado de domínio.

SPR-013 (Domínio: Content) segue ✅ **Concluída** — ver "Sprints Concluídas" e "Último Marco"
abaixo para o histórico completo.

Última atualização:

**10/10/2026**

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
| SPR-014 | Domínio: Publication (`Publication`, API REST) | ✅ |

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

## ✅ SPR-014 — Domínio: Publication concluída

### Principais entregas

- `ADR-013-publication-domain-and-ownership-strategy.md` e
  `engineering/designs/SPR-014-publication-domain.md`: primeiro agregado de quarto nível
  (bisneto de `Project`, filho de `Content`) sem `ownerId` próprio — ownership derivada de
  `Publication.contentId → Content.campaignId → Campaign.projectId → Project.ownerId`;
  cardinalidade `Content → Publication` 1:N
- `PublicationsRepository`, `PublicationsService`, `PublicationOwnershipGuard`,
  `PublicationsController` sob `/v1/campaigns/:campaignId/contents/:contentId/publications`
  (Blocos A, B e C)
- Lifecycle `DRAFT ⇄ SCHEDULED`: `schedule` exige `scheduledAt` futuro, `unschedule` limpa
  `scheduledAt` para `null`; transições não-idempotentes (`409` ao repetir o mesmo estado); sem
  `PUBLISHED`/`FAILED`/`RETRYING` — dependem de execução real, fora de escopo desta sprint
- `PublicationOwnershipGuard` específico do módulo (YAGNI — quarta reavaliação da abstração
  genérica, deliberadamente adiada, registrada em `ADR-013`); diferente de
  `ContentOwnershipGuard`, valida `:contentId` incondicionalmente (sempre presente na rota,
  inclusive em `create`/`list`); falhas de ownership retornam sempre `404 Not Found`, incluindo
  proteção contra IDOR entre usuários e com `:contentId`/`:campaignId` inconsistentes
- `engineering/backlog/SPR-014.md` atualizado durante o encerramento formal
- `engineering/runbooks/sprint-closure.md` aplicado pela quinta vez

Marco anterior: SPR-013 (Domínio: Content) — ver `CHANGELOG.md` para o histórico completo de
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

Nenhuma sprint em andamento no momento — SPR-014 foi concluída (ver "Último Marco" acima) e a
próxima ainda não foi definida. Ver seção "Próxima Sprint" abaixo para as trilhas registradas no
backlog.

**Release:** não atribuída antecipadamente (ver convenção em `VISION.md`, seção "Roadmap
Estratégico"). SPR-008 (RBAC, HTTP Pipeline, Versionamento), SPR-009 (Domínio: Projetos),
SPR-010 (Governança do Prisma Client + CI), SPR-012 (Domínio: Campaign), SPR-013 (Domínio:
Content) e SPR-014 (Domínio: Publication) seguem em `[Unreleased]` no `CHANGELOG.md`, sem tag
cortada desde a `0.2.0`. A versão real será definida no momento em que uma release for de fato
marcada, podendo agrupar as sprints em uma única release ou não — decisão de release, não de
roadmap.

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
| Domínio de Negócio (Publication) | ✅ |
| CI/CD | ✅ CI operacional (GitHub Actions, PR + push em `main`); CD fora de escopo |

---

# Próxima Sprint

SPR-014 (Domínio: Publication) foi concluída — ver "Último Marco" acima. A próxima sprint ainda
não foi definida.

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
