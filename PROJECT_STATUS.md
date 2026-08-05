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

**SPR-009 — Domínio: Projetos — 🟡 Design Freeze (aguardando aprovação do Arquiteto-Chefe)**
Status:
🟡 `ADR-008`, `ADR-009`, `ADR-010` propostas; `SPR-009-projects-domain.md` entregue para revisão
⬜ Bloco A (Persistência) — aguardando aprovação do Design Freeze
⬜ Bloco B (Regras de Negócio e Autorização) — aguardando aprovação do Bloco A
⬜ Bloco C (API REST) — aguardando aprovação do Bloco B

SPR-008 (Autorização RBAC e HTTP Pipeline) está ✅ **Concluída** — Blocos A, B e C aprovados e
mergeados.

Dívida técnica registrada (fora de escopo desta e da sprint anterior, encaminhada): `TECH-001` —
versionamento do Prisma Client gerado. Ver `engineering/tech-debt/` e
`engineering/backlog/infra-backlog.md`.

Última atualização:

**04/08/2026**

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

## ✅ SPR-007 concluída

### Principais entregas

- AuthModule
- UsersModule
- JWT Authentication
- Refresh Token Rotation
- Reuse Detection
- Global Guard
- Swagger Bearer Authentication
- Testes Unitários
- Testes E2E

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

## SPR-009 — Domínio: Projetos

Objetivos (Design Freeze proposto — ver `ADR-008`, `ADR-009`, `ADR-010`,
`engineering/backlog/SPR-009.md`, aguardando aprovação)

- Bloco A: Persistência (`model Project`, `ProjectsRepository`) — ⬜ aguardando aprovação do Design Freeze
- Bloco B: Regras de negócio e autorização (`ProjectsService`, `ProjectOwnershipGuard`) — ⬜ aguardando aprovação do Bloco A
- Bloco C: API REST (`ProjectsController`, DTOs, Swagger, testes E2E) — ⬜ aguardando aprovação do Bloco B

Explicitamente fora de escopo nesta sprint: Campanha, Conteúdo, Publicação, colaboração
multi-usuário em projetos, transferência de propriedade, `DELETE` físico, painel administrativo
de listagem global.

Release prevista:

Não atribuída antecipadamente (ver convenção adicionada em `VISION.md`, seção "Roadmap
Estratégico" — nesta auditoria). SPR-008 (RBAC, HTTP Pipeline, Versionamento) ainda está em
`[Unreleased]` no `CHANGELOG.md`, sem tag cortada. A versão real da SPR-009 será definida no
momento em que uma release for de fato marcada, podendo agrupar SPR-008 e SPR-009 juntas ou não
— decisão de release, não de roadmap.

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
| Domínio de Negócio (Projetos) | 🟡 Design Freeze |
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
