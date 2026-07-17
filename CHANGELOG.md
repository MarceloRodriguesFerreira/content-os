# Changelog

Todas as mudanças relevantes deste projeto serão registradas aqui.

---

## [Unreleased]

### Added

- SPR-003: Módulo de configuração centralizada (`ConfigModule` + `ConfigService`) na API
- Validação tipada e fail-fast das variáveis de ambiente obrigatórias (`env.validation.ts`)
- `PrismaService` passa a resolver `DATABASE_URL` via `ConfigService`, removendo acesso direto a `process.env`

---

## [0.1.0] - 2026-07-10

### Added

- Monorepo Turborepo
- Next.js
- NestJS
- Health Module
- Engenharia Base