# Roadmap do Content-OS

## Visão Geral

O desenvolvimento do Content-OS será incremental, priorizando a construção de uma base sólida antes da implementação das funcionalidades de negócio.

---

# Release 0.1 — Fundação

## SPR-001 ✅

- Estrutura do monorepo
- Turborepo
- NestJS
- Next.js
- Docker
- Health Module

## SPR-002 ✅

- PostgreSQL
- Prisma 7
- Docker Compose
- Migration inicial
- Prisma Module
- Prisma Service

## SPR-003 ✅

- Configuration Module
- ConfigService
- Validação de ambiente
- Configuração centralizada
- AppConfigModule / AppConfigService (fachada tipada sobre o ConfigService)

## SPR-004 ✅

- Hardening do PrismaModule/PrismaService (lifecycle, logging, erros)
- Graceful shutdown (`enableShutdownHooks`)
- Testes unitários do PrismaService
- Correção da suíte de testes (Jest + Prisma 7 / ESM)

---

# Release 0.2

## Segurança

- JWT
- Login
- Refresh Token
- RBAC
- Usuários
- Perfis
- Permissões

---

# Releases seguintes

O roadmap de produto a partir daqui (funcionalidades de negócio e releases futuras) é mantido em:

- `PROJECT_STATUS.md`
- `VISION.md`
