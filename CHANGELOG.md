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

### Changed

- Centralização completa das configurações da aplicação
- Integração do Prisma com AppConfigService
- Reorganização da documentação oficial
- Consolidação da documentação de produto na raiz do repositório
- Remoção de documentação duplicada em engineering/
- `HealthController`/`HealthService` com tipagem de retorno explícita
  (`HealthResponseDto`) (SPR-005)
- `AppController` com tag e operação documentadas no Swagger (SPR-005)

### Fixed

- Compatibilidade Prisma 7
- Compatibilidade Jest 29 + ts-jest
- Carregamento do .env em diferentes diretórios do monorepo
- Encerramento correto das conexões Prisma
- Placeholder inválido de `allowBuilds` em `pnpm-workspace.yaml`
  (`@scarf/scarf`), que quebrava `pnpm install`/`pnpm lint` após a
  instalação do `@nestjs/swagger` (SPR-005)
