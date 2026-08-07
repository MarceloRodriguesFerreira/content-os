# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue as recomendações do Keep a Changelog e utiliza Versionamento Semântico (SemVer).

---

# [Unreleased]

## Added

- RBAC (SPR-008, Bloco A): `enum Role` (`SUPER_ADMIN`, `ADMIN`, `USER`) nativo do Prisma, papel
  único por usuário, `@default(USER)` (`ADR-004-rbac-strategy.md`)
- `JwtPayload` passa a incluir `role`
- `@Roles()` decorator e `RolesGuard` (autorização por rota, não global — combina com o
  `JwtAuthGuard` global já existente da SPR-007)
- `GET /users/me` passa a expor `role` na resposta
- `ADR-005-api-versioning-strategy.md` (estratégia de versionamento de API — decisão registrada,
  implementação prevista para o Bloco C)
- Testes unitários para `RolesGuard`; `AuthController` e `UsersController` passam a ter
  cobertura de testes unitários (não existia antes desta sprint)
- HTTP Pipeline (SPR-008, Bloco B / `ADR-007-http-response-standardization.md`):
  `ValidationPipe` global (`ADR-003`), `AllExceptionsFilter` global e `TransformInterceptor`
  global — todos registrados via token de DI (`APP_PIPE`/`APP_FILTER`/`APP_INTERCEPTOR`) para
  que produção e testes E2E usem exatamente o mesmo pipeline
- Testes unitários para `AllExceptionsFilter` e `TransformInterceptor`; novo teste E2E cobrindo
  `ValidationPipe` → `AllExceptionsFilter` de ponta a ponta (rejeição de campo desconhecido)
- Versionamento de API (SPR-008, Bloco C / `ADR-005-api-versioning-strategy.md`): URI Versioning
  nativo do NestJS, `defaultVersion: '1'`
- `apps/api/src/bootstrap/configure-app.ts` (`configureApp()`): configuração de bootstrap
  compartilhada entre `main.ts` e os testes E2E — evita divergência em configurações que não são
  expressáveis via token de DI (como `app.enableVersioning()`)
- Testes E2E cobrindo o versionamento: `/health` fora de `/v1`, `GET /` removida (404)

- **Domínio: Projetos (SPR-009)** — primeiro agregado de negócio do Content-OS. Decisões
  registradas em `ADR-008-project-aggregate-strategy.md`,
  `ADR-009-resource-ownership-authorization.md` e `ADR-010-rest-api-conventions.md`.

  - **Bloco A (Persistência):** `enum ProjectStatus` e `model Project` (`schema.prisma`),
    relação inversa `projects Project[]` em `User`, migration, `ProjectsRepository`
    (Repository Pattern — `findById`, `findManyByOwner` paginado/filtrado, `create`, `update`,
    `updateStatus`), `@@index([ownerId])`. Testes unitários do Repository.
  - **Bloco B (Regras de Negócio e Autorização):** `ProjectsService` (`create`, `update`,
    `archive`, `restore`, `findById`, `list`) — `archive`/`restore` não-idempotentes (`409` em
    transição para o mesmo estado); `update` exige ao menos um campo (`400`); tradução de
    `status: 'ALL'`/omitido → filtro de listagem. `ProjectOwnershipGuard` (`ADR-009`) — dono ou
    `ADMIN`/`SUPER_ADMIN` acessa; projeto inexistente → `404` (não `403`, contra enumeração).
    Testes unitários de ambos.
  - **Bloco C (API REST):** `CreateProjectDto`, `UpdateProjectDto`, `ListProjectsQueryDto`,
    `ProjectResponseDto`; `PaginatedResponseDto<T>` genérico e compartilhado em `common/dto/`
    (`ADR-010`) — documentado no Swagger via `@ApiExtraModels`/`getSchemaPath`, sem subclasse
    concreta por módulo. `ProjectsController` sob `/v1/projects`:

    ```
    POST   /v1/projects
    GET    /v1/projects
    GET    /v1/projects/:id
    PATCH  /v1/projects/:id
    POST   /v1/projects/:id/archive
    POST   /v1/projects/:id/restore
    ```

    `ProjectsModule` registrado em `AppModule`. Tag `Projects` no Swagger, com nota sobre o
    envelope de paginação na descrição geral da API. Testes E2E cobrindo fluxo completo,
    isolamento entre usuários (`ADR-009`), acesso administrativo, paginação, validação de
    entrada e conflito de estado.

## Changed

- **BREAKING (Bloco C):** todas as rotas de negócio migram para `/v1`: `/auth/login` →
  `/v1/auth/login`, `/auth/refresh` → `/v1/auth/refresh`, `/auth/logout` → `/v1/auth/logout`,
  `/users/me` → `/v1/users/me`. `/health` permanece em `/health` (fora do versionamento,
  `VERSION_NEUTRAL`). Ver `ADR-005`.

- **BREAKING (Bloco B):** toda resposta de sucesso agora vem envelopada como
  `{ success: true, data, timestamp }` (exceto `204 No Content`, que continua sem corpo); toda
  resposta de erro agora vem como
  `{ success: false, error: { statusCode, error, message }, path, timestamp }`. O **status HTTP
  não muda** — só o formato do corpo. Como o produto ainda não tem consumidores externos
  publicados, não há período de coexistência com o formato antigo. Ver `ADR-007`.
- `auth.e2e-spec.ts` não aplica mais um `ValidationPipe` local próprio — passa a herdar do
  `AppModule`, igual à produção.

## Removed

- `GET /` (rota raiz), `AppController` e `AppService` — artefato do scaffold padrão do NestJS,
  sem função de negócio, documentação ou consumidor conhecido. Ver `ADR-005`, seção "Avaliação de
  `GET /`".

## Known Limitations

- (Nenhuma nesta seção — a limitação anterior sobre confirmação E2E do claim `role` foi resolvida
  após o merge do Bloco A, com o Prisma Client regenerado de verdade.)
- `ADR-008`, `ADR-009` e `ADR-010` permanecem com `Status: Proposed` nos respectivos arquivos,
  apesar dos três blocos da SPR-009 já implementados sobre eles — pendência de governança
  registrada, não bloqueante para a funcionalidade entregue.

## Technical Debt

- `TECH-001` registrado: estratégia de versionamento do Prisma Client gerado
  (`apps/api/generated/`) — explicitamente fora do escopo desta sprint, encaminhado para uma
  sprint própria de infraestrutura (`engineering/backlog/infra-backlog.md`, futura
  `ADR-006-generated-artifacts-versioning-policy.md`).

---

# [0.2.0] - 2026-07-30

## Added

### Fundação da Plataforma

- Monorepo utilizando Turborepo + pnpm
- Backend NestJS 11
- Frontend Next.js
- PostgreSQL
- Docker Compose
- Prisma ORM
- Primeira migration do banco de dados
- Estrutura oficial de engenharia
- ADRs
- Design Docs
- Templates
- Standards
- Checklists
- Runbooks

---

### SPR-003 — Configuração Centralizada

- AppConfigModule
- AppConfigService
- Validação tipada das variáveis de ambiente
- Configuração centralizada da aplicação
- Graceful Shutdown do Prisma
- Logging do lifecycle do Prisma
- Testes unitários do PrismaService
- Testes End-to-End

---

### SPR-004 — Fundação de Persistência

- Estrutura definitiva do Prisma
- Organização das migrations
- Integração do PostgreSQL
- Base para persistência dos módulos futuros

---

### SPR-005 — Swagger / OpenAPI

- Configuração completa do `@nestjs/swagger`
- DocumentBuilder
- SwaggerModule
- OpenAPI 3
- Interface interativa disponível em `/api/docs`
- Documento OpenAPI disponível em `/api/docs-json`
- Organização por Tags (`App` e `Health`)
- DTO `HealthResponseDto` documentado
- Documentação automática dos endpoints
- Versionamento inicial da API

---

### SPR-006 — Arquitetura de Segurança

- ADR-002
- Design completo da camada de autenticação
- Estratégia JWT
- Estratégia de Refresh Token
- Estratégia de rotação
- Estratégia de detecção de reuso
- Definição do Guard Global
- Estratégia para autenticação Stateless

---

### SPR-007 — Camada de Autenticação

- AuthModule
- UsersModule
- JWT Authentication
- Access Token
- Refresh Token
- Refresh Token Rotation
- Refresh Token Reuse Detection
- Guard Global (`JwtAuthGuard`)
- Decorators `@Public()` e `@CurrentUser()`
- Estratégia JWT (`JwtStrategy`)
- Hash de senha com bcrypt
- Modelo `RefreshToken`
- Migration Prisma para Refresh Tokens
- Swagger Bearer Authentication
- Endpoints:

  - POST /auth/login
  - POST /auth/refresh
  - POST /auth/logout
  - GET /users/me

- Testes Unitários
- Testes End-to-End

---

### Documentação

- ENGINEERING_GUIDE.md
- Guia para Claude
- Guia para ChatGPT
- Guia para GitHub Copilot
- Atualização do PROJECT_STATUS.md
- Atualização da documentação oficial
- Retrospectivas das SPR-003 até SPR-007

---

## Changed

### Arquitetura

- Configuração centralizada utilizando AppConfigService
- Integração completa do Prisma com AppConfigService
- Organização definitiva da documentação oficial
- Consolidação da documentação de produto na raiz do projeto
- Remoção de documentação duplicada
- Swagger integrado ao processo oficial de desenvolvimento
- Guard Global registrado via `APP_GUARD`
- `/health` explicitamente marcada como rota pública

---

### API

- Tipagem explícita do HealthController
- Tipagem explícita do HealthService
- Swagger utilizando Bearer Authentication
- Toda rota protegida por padrão
- Apenas rotas anotadas com `@Public()` permanecem públicas

---

## Fixed

- Compatibilidade com Prisma 7
- Compatibilidade com Jest 29
- Compatibilidade com ts-jest
- Carregamento do `.env` em diferentes diretórios do monorepo
- Encerramento correto das conexões do Prisma
- Graceful Shutdown do Prisma
- Placeholder inválido de `allowBuilds` em `pnpm-workspace.yaml`
- Compatibilidade do Swagger com NestJS 11

---

## Known Limitations

- Ainda não existe endpoint para registro de usuários (`POST /users` ou `/auth/register`).
- O `ValidationPipe` global ainda não foi implementado.
- A definição da estratégia de criação de usuários ficará para uma sprint futura.
