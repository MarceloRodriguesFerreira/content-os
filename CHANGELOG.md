# Changelog

Todas as mudanças relevantes deste projeto serão registradas aqui.

---

## [Unreleased]

### Added

- SPR-003: Módulo de configuração centralizada (`ConfigModule` + `ConfigService`) na API
- Validação tipada e fail-fast das variáveis de ambiente obrigatórias (`env.validation.ts`)
- `PrismaService` passa a resolver `DATABASE_URL` via `ConfigService`, removendo acesso direto a `process.env`
- SPR-003 (refinamento): `AppConfigModule`/`AppConfigService` encapsulando `ConfigService` (fachada tipada, sem chaves de configuração cruas espalhadas pela aplicação)
- SPR-004: `PrismaService` com logging (`Logger`) e tratamento de erro no lifecycle (`onModuleInit`/`onModuleDestroy`)
- SPR-004: `app.enableShutdownHooks()` em `main.ts`, habilitando graceful shutdown real (conexão do Prisma é fechada ao receber `SIGTERM`/`SIGINT`)
- SPR-004: testes unitários para `PrismaService` (conexão, desconexão e os dois caminhos de erro, sem depender de um Postgres real)

### Fixed

- SPR-004: suíte de testes (unitária e e2e) não conseguia sequer carregar `PrismaModule`/`AppModule` — corrigido `moduleNameMapper` no Jest (imports `.js` do client Prisma 7 sob `moduleResolution: "nodenext"`) e adicionada a flag `--experimental-vm-modules` ao script `test:e2e` (exigida pelo motor WASM do Prisma 7)
- `PROJECT_STATUS.md`: backlog desatualizado corrigido (Docker Compose, PostgreSQL, Prisma e migration inicial já estavam implementados desde a SPR-002, mas constavam como pendentes)

---

## [0.1.0] - 2026-07-10

### Added

- Monorepo Turborepo
- Next.js
- NestJS
- Health Module
- Engenharia Base