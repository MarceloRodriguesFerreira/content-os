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

**SPR-008 — Autorização (RBAC) e HTTP Pipeline — 🟡 Bloco C implementado, aguardando aprovação**
Status:
✔ Design Freeze aprovado (`ADR-004`, `ADR-005`, `ADR-007`)
✅ Bloco A (RBAC) — concluído, aprovado pelo Arquiteto-Chefe
✅ Bloco B (HTTP Pipeline) — concluído, aprovado pelo Arquiteto-Chefe
🟡 Bloco C (Plataforma/Versionamento) — implementado (URI Versioning `/v1`, `configureApp()`
  compartilhado entre produção e E2E, `GET /` removido), aguardando aprovação

SPR-007 (Camada de Autenticação) permanece ✅ Concluída — não foi alterada nesta sprint.

Dívida técnica registrada nesta sprint (fora de escopo, encaminhada): `TECH-001` — versionamento
do Prisma Client gerado. Ver `engineering/tech-debt/` e `engineering/backlog/infra-backlog.md`.

Última atualização:

**03/08/2026**

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

## SPR-008 — Autorização (RBAC) e HTTP Pipeline

Objetivos (escopo congelado — ver `ADR-004`, `ADR-005`, `engineering/backlog/SPR-008.md`)

- Bloco A: RBAC via `enum Role` (`SUPER_ADMIN`/`ADMIN`/`USER`), papel único por usuário — ✅ concluído
- Bloco B: ValidationPipe, ExceptionFilter e TransformInterceptor globais — 🟡 implementado, aguardando aprovação
- Bloco C: Versionamento de API (`/v1`) — 🟡 implementado, aguardando aprovação

Explicitamente fora de escopo nesta sprint: Permissions, Claims granulares, Policy Engine, ACL,
múltiplos papéis por usuário, endpoint de registro de usuários, OAuth, MFA, Multi-tenancy
(estes três últimos apenas documentados como pontos de extensão futura).

Release prevista:

**0.3.x**

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
| CI/CD | ⬜ |

---

# Próxima Sprint

## SPR-008 — Autorização (RBAC) e HTTP Pipeline

### Objetivos (escopo congelado)

- Bloco A: Roles (`enum` nativo, papel único por usuário)
- Bloco B: ValidationPipe, ExceptionFilter e TransformInterceptor globais
- Bloco C: Versionamento de API

---

# Pendências Conhecidas (não bloqueantes)

- Definir estratégia de registro de usuários (fora de escopo da SPR-008, ver backlog).
- Modelo de Roles definido em `ADR-004` (papel único, sem Permissions/Claims — não é mais
  pendência de definição; Permissions/Claims permanecem fora de escopo até haver gatilho real,
  ver "Future Evolution" da `ADR-004`).
- Estruturar pipeline de CI/CD.
- `TECH-001`: revisar estratégia de versionamento do Prisma Client gerado (`apps/api/generated/`)
  — adiado para sprint própria de infraestrutura, ver `engineering/backlog/infra-backlog.md`.
