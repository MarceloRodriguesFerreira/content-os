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

### Changed

- Centralização completa das configurações da aplicação
- Integração do Prisma com AppConfigService
- Reorganização da documentação oficial
- Consolidação da documentação de produto na raiz do repositório
- Remoção de documentação duplicada em engineering/

### Fixed

- Compatibilidade Prisma 7
- Compatibilidade Jest 29 + ts-jest
- Carregamento do .env em diferentes diretórios do monorepo
- Encerramento correto das conexões Prisma
