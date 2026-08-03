# SPR-008 — Bloco B — HTTP Pipeline (Design Doc)

Status: Accepted

## Objetivo

Padronizar o pipeline HTTP da API: validação de entrada (`ValidationPipe`, `ADR-003`),
tratamento uniforme de erros (`AllExceptionsFilter`) e formato uniforme de resposta de sucesso
(`TransformInterceptor`) — todos globais.

---

## Ordem do pipeline

```
Request
  │
  ▼
ValidationPipe (global)          → valida/transforma o DTO de entrada; rejeita campo desconhecido
  │
  ▼
JwtAuthGuard (global)            → autentica (ADR-002)
  │
  ▼
RolesGuard (por rota, se @Roles())→ autoriza (ADR-004)
  │
  ▼
Controller → Service → Repository
  │
  ▼
TransformInterceptor (global)    → envelopa resposta de sucesso
  │
  ▼
Response 2xx

Em qualquer ponto de falha (validação, autenticação, autorização, exceção de negócio ou erro
não tratado):
  │
  ▼
AllExceptionsFilter (global)     → envelopa resposta de erro
  │
  ▼
Response 4xx/5xx
```

`ValidationPipe`, `AllExceptionsFilter` e `TransformInterceptor` são registrados via os tokens de
DI do Nest (`APP_PIPE`, `APP_FILTER`, `APP_INTERCEPTOR`) em `AppModule` — não via
`app.useGlobalPipes()`/`useGlobalFilters()`/`useGlobalInterceptors()` imperativos em `main.ts`.

**Motivo:** os testes E2E constroem a aplicação a partir de `AppModule` diretamente
(`Test.createTestingModule({ imports: [AppModule] })`), sem passar por `main.ts`. Registrar via
token de DI garante que produção e testes E2E tenham exatamente o mesmo pipeline, sem
duplicação manual — hoje `auth.e2e-spec.ts` reaplica um `ValidationPipe` local só para os
testes, com um comentário reconhecendo essa lacuna; este bloco a resolve.

---

## Envelope de sucesso (`TransformInterceptor`)

```json
{
  "success": true,
  "data": { "...": "payload original do handler, sem alteração" },
  "timestamp": "2026-08-02T19:00:00.000Z"
}
```

- `data` é exatamente o que o Controller já retornava — nenhum DTO de resposta existente
  (`AuthResponseDto`, `UserResponseDto`, `HealthResponseDto`) muda de formato internamente, só
  passa a vir dentro de `data`.
- Aplicado a **toda** rota, incluindo `/health` — a padronização de resposta é uma decisão de
  HTTP Pipeline (Bloco B), independente da decisão de versionamento de rotas (Bloco C, `ADR-005`).
- **Exceção deliberada — `204 No Content`:** `POST /auth/logout` usa `@HttpCode(204)` e não
  retorna corpo. Por definição HTTP, uma resposta 204 não tem corpo — o `TransformInterceptor`
  detecta esse status e **não** envelopa, para não violar essa semântica.

## Envelope de erro (`AllExceptionsFilter`)

```json
{
  "success": false,
  "error": {
    "statusCode": 401,
    "error": "Unauthorized",
    "message": "Credenciais inválidas."
  },
  "path": "/auth/login",
  "timestamp": "2026-08-02T19:00:00.000Z"
}
```

- Para `HttpException` (a grande maioria dos erros da aplicação hoje: `UnauthorizedException`,
  `ForbiddenException`, `BadRequestException` do `ValidationPipe`, etc.), `error.message` e
  `error.error` vêm da própria exceção (`exception.getResponse()`), preservando o que os testes
  E2E já esperam quanto ao **status HTTP** — só o formato do corpo muda.
- Para qualquer exceção **não** prevista (não é uma `HttpException` — ex.: erro inesperado de
  infraestrutura), o filtro responde `500` com uma mensagem genérica
  (`"Erro interno do servidor."`), **sem vazar stack trace ou detalhes internos** no corpo da
  resposta — o erro real é logado no servidor (`Logger`), não exposto ao cliente.

---

## Impacto nos testes existentes

- `app.e2e-spec.ts`: `/health` e `/` passam a retornar o corpo dentro de `data`/`error`. Ajustado
  nesta entrega.
- `auth.e2e-spec.ts`: toda asserção de corpo (`loginResponse.body.accessToken`, etc.) passa a ler
  de `body.data.*`. Ajustado nesta entrega. A duplicação local do `ValidationPipe` é removida —
  passa a vir do `AppModule` como qualquer outro teste.
- Nenhuma asserção de **status HTTP** (`.expect(200)`, `.expect(401)`, etc.) muda — só o corpo.

---

## Critérios de Aceite

- Toda resposta 2xx segue o envelope de sucesso.
- Toda resposta de erro (4xx/5xx) segue o envelope de erro, sem vazar detalhes internos em
  exceções não tratadas.
- `ValidationPipe`, `AllExceptionsFilter` e `TransformInterceptor` funcionam de forma idêntica em
  produção (`main.ts`) e em testes E2E (`AppModule` puro), sem configuração duplicada.
- Nenhuma rota deixa de funcionar; apenas o formato do corpo muda.
