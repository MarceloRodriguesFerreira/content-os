# 🚀 Content-OS

> Plataforma inteligente para criação, organização e publicação de conteúdo para redes sociais utilizando Inteligência Artificial.

---

# O Projeto

O **Content-OS** é uma plataforma construída para acelerar a criação de conteúdo para redes sociais através de Inteligência Artificial.

O objetivo é permitir que empresas e criadores produzam conteúdo de forma organizada, reutilizável e integrada com múltiplas plataformas.

O projeto está sendo desenvolvido utilizando arquitetura moderna baseada em Monorepo, APIs REST e integração com IA.

---

# Tecnologias

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

## Infraestrutura

- Docker
- Docker Compose

---

# Estrutura do Projeto

```
apps/
    api/
    web/

packages/

engineering/
    adrs/
    designs/
    standards/
    runbooks/
    templates/
    checklists/
    retrospectives/

docs/
```

---

# Funcionalidades Implementadas

## Fundação da Plataforma

- ✅ Monorepo (Turborepo + pnpm)
- ✅ Backend NestJS
- ✅ Frontend Next.js
- ✅ PostgreSQL
- ✅ Docker Compose
- ✅ Prisma ORM
- ✅ Primeira Migration
- ✅ Configuração centralizada
- ✅ Graceful Shutdown
- ✅ Logging do Prisma

---

## Documentação da API (SPR-005)

- ✅ Swagger/OpenAPI
- ✅ DocumentBuilder
- ✅ SwaggerModule
- ✅ Interface em `/api/docs`
- ✅ Documento OpenAPI em `/api/docs-json`
- ✅ Versionamento inicial da API
- ✅ Organização por Tags
- ✅ DTOs documentados

---

## Segurança (SPR-006 / SPR-007)

- ✅ JWT Authentication
- ✅ Access Token
- ✅ Refresh Token
- ✅ Rotação automática de Refresh Token
- ✅ Detecção de reutilização de Refresh Token
- ✅ Logout
- ✅ Guard Global
- ✅ Decorators `@Public()` e `@CurrentUser()`
- ✅ Hash de senha utilizando bcrypt
- ✅ Swagger Bearer Authentication

---

## Qualidade

- ✅ Testes Unitários
- ✅ Testes End-to-End
- ✅ Lint
- ✅ Build automatizado

---

## Autorização RBAC e HTTP Pipeline (SPR-008)

- ✅ `enum Role` (`SUPER_ADMIN`, `ADMIN`, `USER`)
- ✅ `@Roles()` decorator e `RolesGuard`
- ✅ `ValidationPipe` global
- ✅ `AllExceptionsFilter` e `TransformInterceptor` globais (envelope padrão de resposta)
- ✅ Versionamento de API (`/v1`, URI Versioning)

---

## Domínio: Projetos (SPR-009)

- ✅ Primeiro agregado de negócio da plataforma: `Project`
- ✅ `ProjectsRepository` (Repository Pattern)
- ✅ `ProjectsService` (criação, atualização parcial, arquivamento/restauração, listagem paginada)
- ✅ `ProjectOwnershipGuard` — autorização por propriedade de recurso
- ✅ DTOs de entrada/saída, `PaginatedResponseDto` genérico compartilhado
- ✅ `ProjectsController` sob `/v1/projects`
- ✅ Documentação Swagger completa (tag `Projects`)
- ✅ Testes Unitários e End-to-End (fluxo completo, isolamento entre usuários, acesso
  administrativo, paginação, validação, conflito de estado)

---

# Estrutura da API

> A partir da SPR-008 (Bloco C), toda rota de negócio vive sob `/v1` (URI Versioning nativo do
> NestJS — `ADR-005`). `/health` permanece fora do versionamento, por ser consumido por
> infraestrutura (orquestradores, monitoramento), não por clientes de negócio.

## Health

```
GET /health
```

---

## Autenticação

```
POST /v1/auth/login
POST /v1/auth/refresh
POST /v1/auth/logout
```

---

## Usuários

```
GET /v1/users/me
```

---

## Projetos

```
POST   /v1/projects
GET    /v1/projects
GET    /v1/projects/:id
PATCH  /v1/projects/:id
POST   /v1/projects/:id/archive
POST   /v1/projects/:id/restore
```

Todas as rotas exigem autenticação. As rotas com `:id` exigem, além disso, ser o dono do
projeto (ou `ADMIN`/`SUPER_ADMIN`) — `ProjectOwnershipGuard`, `ADR-009`.

---

# Como executar

## Clonar

```bash
git clone https://github.com/MarceloRodriguesFerreira/content-os.git

cd content-os
```

---

## Instalar dependências

```bash
pnpm install
```

---

## Subir o banco

```bash
docker compose up -d
```

---

## Gerar o Prisma Client

```bash
pnpm --filter api exec prisma generate
```

---

## Executar as migrations

```bash
pnpm --filter api exec prisma migrate dev
```

---

## Executar Backend

```bash
pnpm --filter api start:dev
```

---

## Executar Frontend

```bash
pnpm --filter web dev
```

---

# Testes

## Unitários

```bash
pnpm --filter api test
```

## End-to-End

```bash
pnpm --filter api test:e2e
```

---

# Qualidade

## Build

```bash
pnpm --filter api build
```

## Lint

```bash
pnpm --filter api lint
```

---

# Swagger

Após iniciar a API:

```
http://localhost:3000/api/docs
```

OpenAPI JSON:

```
http://localhost:3000/api/docs-json
```

---

# Roadmap

O roadmap oficial está disponível em:

- `VISION.md`

O andamento da implementação está disponível em:

- `PROJECT_STATUS.md`

---

# Documentação Oficial

| Documento | Finalidade |
|------------|------------|
| README.md | Visão geral do projeto |
| VISION.md | Visão do Produto |
| ARCHITECTURE.md | Arquitetura oficial |
| PROJECT_STATUS.md | Situação atual do desenvolvimento |
| CHANGELOG.md | Histórico de versões |
| CONTRIBUTING.md | Guia de contribuição |
| ENGINEERING_GUIDE.md | Processo oficial de engenharia |
| engineering/ | ADRs, Designs, Standards, Templates, Checklists, Runbooks e Retrospectives |

---

# Status Atual

**Release:** 0.2.0 (número de versão real ainda não atribuído às sprints abaixo — ver convenção
de SemVer em `VISION.md`; nenhuma tag foi cortada desde a 0.2.0)

**Sprint Atual:** SPR-009 — Bloco C implementado, aguardando aprovação arquitetural final.
Blocos A e B já aprovados e mergeados; **a sprint ainda não foi encerrada** — ver
`PROJECT_STATUS.md` para o histórico completo de sprints e o detalhamento por bloco.

Entregas do Bloco C, pendentes de aprovação:

- Primeiro agregado de negócio: `Project` (persistência e regras de negócio dos Blocos A/B, já
  aprovados)
- API REST completa sob `/v1/projects`, com DTOs, Swagger e testes E2E

Principais entregas da SPR-008:

- Autorização RBAC (`Role`, `@Roles()`, `RolesGuard`)
- HTTP Pipeline padronizado (`ValidationPipe`, `AllExceptionsFilter`, `TransformInterceptor`)
- Versionamento de API (`/v1`)

---

# Próximas Etapas

Ainda não definidas — ver "Próxima Sprint" em `PROJECT_STATUS.md` para as trilhas registradas
no backlog (política de versionamento do Prisma Client gerado, endpoint de registro de
usuários, pipeline de CI/CD).

---

# Licença

Projeto privado.
