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

**SPR-006 — Segurança (JWT)**

SPR-005 (Documentação da API) foi oficialmente encerrada como Marco Técnico
da Release 0.2 — ver "Último Marco".

Última atualização:

**23/07/2026**

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
| Autenticação | ⬜ Planejado |
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

# Developer Experience

Planejado

- [ ] pnpm check
- [ ] pnpm quality
- [ ] pnpm setup
- [ ] pnpm reset

---

# Último Marco

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

## ✅ Marco Técnico — SPR-005 concluída (Documentação da API)

Swagger/OpenAPI disponível em `/api/docs`, com o módulo Health como
referência de padrão para os módulos futuros.

Permanece dentro da Release 0.2 — Swagger é infraestrutura, não
funcionalidade de negócio. A Release 0.3 só se inicia quando existir a
primeira funcionalidade real de produto.

Próxima sprint: **SPR-006 — Segurança (JWT)**.

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
| CI/CD | ⬜ |

---

# Próxima Sprint

## SPR-006 — Segurança (JWT)

## Pendências conhecidas (não bloqueantes)

- `ValidationPipe` global: `ARCHITECTURE.md` lista como convenção adotada, mas
  ainda não está implementado no código. Identificado na validação inicial da
  SPR-005; recomenda-se resolver antes ou junto da SPR-006, quando a
  introdução de DTOs de entrada (request) fará a ausência de validação ter
  impacto real.
