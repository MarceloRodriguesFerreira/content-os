# SPR-008 — Bloco C — Plataforma (Design Doc)

Status: Accepted

## Objetivo

Introduzir versionamento de API (`ADR-005`) sobre o que os Blocos A e B já entregaram, sem
reintroduzir divergência entre produção e testes E2E — mesma preocupação que motivou o registro
via DI no Bloco B (`ADR-007`).

Incorpora os ajustes identificados na revisão arquitetural pré-implementação deste bloco:
correção de sequenciamento na `ADR-005`, remoção de `GET /`, extração de `configureApp()`, e
ordem garantida entre `enableVersioning()` e `setupSwagger()`.

---

## `configureApp()` — configuração de bootstrap compartilhada

```
apps/api/src/bootstrap/configure-app.ts
  export function configureApp(app: INestApplication): void
```

Concentra toda configuração que precisa ser idêntica em produção e em testes E2E, mas que **não**
pode ser expressa via token de DI (ao contrário de `ValidationPipe`/`AllExceptionsFilter`/
`TransformInterceptor`, que são providers e por isso já vêm de `AppModule` automaticamente).

Conteúdo desta função nesta entrega:

```
enableVersioning({ type: URI, defaultVersion: '1' })
```

`main.ts` chama `configureApp(app)` e, **depois**, `setupSwagger(app)` — nessa ordem, sempre. Os
testes E2E (`app.e2e-spec.ts`, `auth.e2e-spec.ts`) chamam `configureApp(app)` no `beforeAll`,
antes de `app.init()`, garantindo que testam exatamente as mesmas rotas (`/v1/...`) que existem
em produção.

Qualquer configuração de bootstrap futura que não seja expressável via DI (ex.: prefixo global,
CORS, etc.) entra nesta mesma função — não é criado um novo ponto de configuração paralelo.

---

## Rotas afetadas

| Antes (Bloco B) | Depois (Bloco C) |
|---|---|
| `POST /auth/login` | `POST /v1/auth/login` |
| `POST /auth/refresh` | `POST /v1/auth/refresh` |
| `POST /auth/logout` | `POST /v1/auth/logout` |
| `GET /users/me` | `GET /v1/users/me` |
| `GET /health` | `GET /health` (inalterado — `VERSION_NEUTRAL`, `ADR-005`) |
| `GET /` | removido (`ADR-005`) |

`HealthController` recebe `@Controller({ path: 'health', version: VERSION_NEUTRAL })`.
`AuthController`/`UsersController` não precisam declarar `version` explicitamente — herdam
`defaultVersion: '1'` da configuração global.

`AppController`/`AppService`/`app.controller.spec.ts` são removidos.

---

## Impacto no Swagger

Nenhuma configuração adicional é necessária em `swagger.config.ts` além da ordem já garantida por
`configureApp()` — o `@nestjs/swagger` reconhece rotas versionadas via `VersioningType.URI`
automaticamente e gera os paths `/v1/...` no documento OpenAPI, desde que `enableVersioning()`
já tenha sido chamado antes de `SwaggerModule.createDocument()`.

---

## Critérios de Aceite

- Toda rota de negócio responde em `/v1/...`; `/health` continua em `/health`; `GET /` deixa de
  existir (404).
- Testes E2E usam os mesmos paths de produção, via `configureApp()` — nenhuma duplicação de
  configuração de versionamento entre `main.ts` e os testes.
- Swagger (`/api/docs`) reflete `/v1/...` corretamente nos paths documentados.
- `lint`, testes unitários, `build` e E2E verdes.
