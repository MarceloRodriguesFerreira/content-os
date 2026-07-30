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
| engineering/ | ADRs, Design Docs, Runbooks, Standards, Templates e Checklists |

---

# Status do Projeto

## Versão Atual

**0.2.0**

## Status

🟢 Em Desenvolvimento

## Sprint Atual

**SPR-007 — Implementação da Camada de Autenticação — ✅ Concluída**

SPR-006 (Design da Camada de Segurança) e ADR-002 (Estratégia de
Autenticação) foram aceitas e implementadas integralmente.

Última atualização:

**29/07/2026**

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
| Testes Unitários | ✅ Operacional |
| Testes E2E | ✅ Operacional |
| Swagger/OpenAPI | ✅ Operacional |
| Autenticação (JWT) | ✅ Operacional |
| CI/CD | ⬜ Planejado |
| Deploy | ⬜ Planejado |

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

## Documentação da API (SPR-005)

- ✅ `@nestjs/swagger` configurado (`DocumentBuilder` + `SwaggerModule`)
- ✅ OpenAPI 3 disponível em `/api/docs-json`
- ✅ UI interativa em `/api/docs`
- ✅ Versionamento inicial (1.0)
- ✅ Organização por tags (`App`, `Health`)
- ✅ Módulo Health documentado por completo (`@ApiOperation`, `@ApiResponse`, DTO com `@ApiProperty`)

## Segurança — Autenticação (SPR-006 design / SPR-007 implementação)

- ✅ `AuthModule`: login, refresh (com rotação) e logout via JWT
- ✅ `UsersModule`: `GET /users/me` (usuário autenticado)
- ✅ Access token JWT (curta duração) + refresh token opaco hasheado (longa duração)
- ✅ Rotação de refresh token com detecção de reuso (revogação em massa)
- ✅ Guard global (`JwtAuthGuard` via `APP_GUARD`) + `@Public()` para exceções
- ✅ Hash de senha via bcrypt
- ✅ Modelo `RefreshToken` (Prisma) com relação a `User`
- ✅ Swagger com Bearer Auth documentado (`Auth`, `Users`)
- ✅ Testes unitários (`AuthService`, `UsersService`, `JwtStrategy`, `JwtAuthGuard`) e e2e do fluxo completo

---

# SPR-005 — Backlog (concluído)

## Objetivo

Implementar a documentação completa da API utilizando Swagger/OpenAPI, estabelecendo um padrão único para todos os módulos futuros.

## Backlog

- [x] Configuração do Swagger
- [x] OpenAPI
- [x] Versionamento da API
- [x] Documentação automática dos endpoints
- [x] DTOs documentados
- [x] Padronização das respostas
- [x] Ambiente `/api/docs`

---

# SPR-007 — Backlog (concluído)

## Objetivo

Implementar integralmente a camada de autenticação do Content-OS, seguindo a SPR-006 e a ADR-002.

## Backlog

- [x] Instalação de dependências (`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`)
- [x] Configuration Module estendido (`JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`)
- [x] Modelo `RefreshToken` no Prisma + migration
- [x] `UsersModule` (repository, service, controller, DTOs)
- [x] `AuthModule` (controller, service, strategy, guard, decorators, repository, DTOs)
- [x] Guard global + rotas públicas (`/health`, `/auth/login`, `/auth/refresh`)
- [x] Swagger com Bearer Auth
- [x] Testes unitários e e2e

## Pendências registradas durante a implementação (não resolvidas nesta sprint, por decisão explícita)

- Não existe endpoint de registro de usuário (`POST /users` ou `/auth/register`) — a SPR-006 não documentou esse fluxo; decisão sobre como deve funcionar (público, convite, admin-only) fica para uma sprint futura.
- `ValidationPipe` global ainda não está implementado, apesar de já haver DTOs de entrada reais em uso (`LoginDto`, `RefreshTokenDto`, `CreateUserDto`) — a pendência registrada na SPR-005 se tornou mais relevante agora.

---

# Developer Experience

Planejado

- [ ] pnpm check
- [ ] pnpm quality
- [ ] pnpm setup
- [ ] pnpm reset

---

# Último Marco

## ✅ SPR-007 — Camada de Autenticação implementada

### Principais entregas

- AuthModule (login, refresh com rotação, logout) + UsersModule (`GET /users/me`)
- JWT (access token) + refresh token opaco hasheado, com detecção de reuso
- Guard global (`JwtAuthGuard`) + `@Public()`
- Modelo `RefreshToken` no Prisma + migration
- Swagger com Bearer Auth
- Testes unitários e e2e do fluxo completo

## ✅ Marco Técnico — SPR-005 concluída (Documentação da API)

### Principais entregas

- Swagger/OpenAPI configurado (`/api/docs`, `/api/docs-json`)
- Módulo Health documentado por completo (referência de padrão)
- Versionamento inicial da API (1.0)
- Organização por tags

## ✅ Release 0.2.0 — Fundação concluída

### Principais entregas

- Configuração Centralizada
- Fundação de Persistência
- Prisma estabilizado
- Graceful Shutdown
- Logging do lifecycle
- Testes Unitários
- Testes E2E
- Documentação consolidada
- Processo oficial de Engenharia

---

# Lições Aprendidas

## Configuração

- Em monorepos o `process.cwd()` pode variar conforme o comando executado.
- O carregamento do `.env` deve considerar diferentes diretórios.

## Testes

Versões homologadas:

- Jest 29.7.x
- ts-jest 29.4.x
- @types/jest 29.5.x

## Prisma

- O lifecycle precisa ser controlado explicitamente.
- Toda conexão deve ser encerrada corretamente.
- Graceful Shutdown evita conexões pendentes.

---

# Próximo Marco

## ✅ SPR-007 — Camada de Autenticação concluída

Login, refresh (com rotação e detecção de reuso) e logout via JWT,
seguindo a SPR-006 e a ADR-002. Guard global protegendo toda rota por
padrão, salvo exceções explícitas (`/health`, `/auth/login`, `/auth/refresh`).

Ainda dentro da Release 0.2 (autenticação é fundação, não funcionalidade
de negócio final).

Próxima sprint: a definir.

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
| Testes Unitários | ✅ |
| Testes E2E | ✅ |
| Build | ✅ |
| Lint | ✅ |
| Swagger | ✅ |
| Autenticação (JWT) | ✅ |
| CI/CD | ⬜ |

---

# Próxima Sprint

A definir.

## Pendências conhecidas (não bloqueantes)

- `ValidationPipe` global ainda não implementado (`ARCHITECTURE.md` lista
  como convenção adotada). Agora há DTOs de entrada reais em produção
  (`LoginDto`, `RefreshTokenDto`, `CreateUserDto`), então a ausência de
  validação passou a ter impacto prático real — prioridade elevada.
- Endpoint de registro de usuário não existe (decisão pendente: público,
  convite, ou admin-only).
- Passo operacional obrigatório após aplicar a SPR-007: rodar
  `pnpm db:generate` e `pnpm db:migrate`/`migrate deploy` antes do build —
  o Prisma Client committed ainda não conhece o modelo `RefreshToken`.
