# Changelog

## [0.2.0] - 2026-07-23

### Added

- AppConfigModule
- AppConfigService
- Validação tipada das variáveis de ambiente
- Configuração centralizada da aplicação
- Graceful Shutdown do Prisma
- Logging do lifecycle do Prisma
- Testes unitários do PrismaService
- Testes E2E
- ENGINEERING_GUIDE.md
- Templates de Engenharia
- Guias de utilização para IA (Claude, ChatGPT e Copilot)
- `@nestjs/swagger` configurado via `DocumentBuilder`/`SwaggerModule` (SPR-005)
- Documentação interativa da API em `/api/docs` (SPR-005)
- Especificação OpenAPI 3 crua em `/api/docs-json` (SPR-005)
- `HealthResponseDto` documentado com `@ApiProperty` (descrições e exemplos) (SPR-005)
- Organização da documentação por tags (`App`, `Health`) (SPR-005)
- `AuthModule`: login, refresh (com rotação) e logout via JWT (SPR-007)
- `UsersModule`: `GET /users/me` (SPR-007)
- Refresh token opaco hasheado (SHA-256), com detecção de reuso e revogação em massa (SPR-007)
- Guard global (`JwtAuthGuard` via `APP_GUARD`) + decorator `@Public()` (SPR-007)
- Hash de senha via bcrypt (SPR-007)
- Modelo `RefreshToken` no Prisma, com migration (SPR-007)
- Variáveis de ambiente `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` via `AppConfigService` (SPR-007)
- Swagger com Bearer Auth (tags `Auth`, `Users`) (SPR-007)
- Testes unitários (`AuthService`, `UsersService`, `JwtStrategy`, `JwtAuthGuard`) e e2e do fluxo de autenticação (SPR-007)

### Changed

- Centralização completa das configurações da aplicação
- Integração do Prisma com AppConfigService
- Reorganização da documentação oficial
- Consolidação da documentação de produto na raiz do repositório
- Remoção de documentação duplicada em engineering/
- `HealthController`/`HealthService` com tipagem de retorno explícita
  (`HealthResponseDto`) (SPR-005)
- `AppController` com tag e operação documentadas no Swagger (SPR-005)
- `AppModule` com `JwtAuthGuard` registrado globalmente (`APP_GUARD`) (SPR-007)
- `/health` marcada explicitamente como pública (`@Public()`) (SPR-007)

### Fixed

- Compatibilidade Prisma 7
- Compatibilidade Jest 29 + ts-jest
- Carregamento do .env em diferentes diretórios do monorepo
- Encerramento correto das conexões Prisma
- Placeholder inválido de `allowBuilds` em `pnpm-workspace.yaml`
  (`@scarf/scarf`), que quebrava `pnpm install`/`pnpm lint` após a
  instalação do `@nestjs/swagger` (SPR-005)
