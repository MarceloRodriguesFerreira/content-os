# ADR-007 — Padronização de Respostas HTTP (Exception Filter + Interceptor)

## Status

Accepted

## Context

A API hoje retorna, para sucesso, exatamente o payload de cada Controller (formatos distintos
por rota) e, para erro, o formato padrão do NestJS (`{statusCode, message, error}`), sem nenhuma
metainformação comum (timestamp, path) e sem uma barreira única contra vazamento de detalhes
internos em exceções não tratadas.

Padronizar isso é, por definição, uma decisão "que vale para todo o projeto" (critério de ADR do
`ENGINEERING_GUIDE.md`) e é cara de reverter depois que clientes (frontend, integrações)
passarem a depender de um formato de corpo específico — por isso esta decisão é formalizada como
ADR, com design detalhado em `SPR-008-bloco-b-http-pipeline.md`.

## Decision

- **`TransformInterceptor`** (global, via `APP_INTERCEPTOR`): envelopa toda resposta de sucesso
  em `{ success: true, data, timestamp }`. `data` é o payload original do Controller, inalterado.
  Exceção deliberada: respostas `204 No Content` (ex.: `POST /auth/logout`) nunca são
  envelopadas, por não terem corpo por definição HTTP.
- **`AllExceptionsFilter`** (global, via `APP_FILTER`): envelopa toda resposta de erro em
  `{ success: false, error: { statusCode, error, message }, path, timestamp }`.
  - Para `HttpException`, o conteúdo de `error` vem da própria exceção — o **status HTTP não
    muda**, só o formato do corpo.
  - Para qualquer exceção não prevista, responde `500` com mensagem genérica, sem vazar stack
    trace — o erro real é logado no servidor, não exposto ao cliente.
- Registro via tokens de DI do Nest (`APP_PIPE`, `APP_FILTER`, `APP_INTERCEPTOR` — mesma
  estratégia já usada para `JwtAuthGuard`/`APP_GUARD` na ADR-002), não via chamadas imperativas
  em `main.ts`, para que testes E2E (que sobem a aplicação a partir de `AppModule` puro) tenham
  exatamente o mesmo pipeline de produção.

## Consequences

- Todo cliente da API passa a ler o payload de sucesso em `body.data`, não na raiz do corpo —
  **mudança de contrato consciente** para todas as rotas existentes (`/auth/*`, `/users/me`,
  `/health`). Como o produto ainda não tem consumidores externos publicados, não há período de
  coexistência de dois formatos.
- Testes E2E existentes (`app.e2e-spec.ts`, `auth.e2e-spec.ts`) foram atualizados para o novo
  formato nesta mesma entrega — tratado como parte do trabalho, não como débito.
- Nenhum status HTTP muda — apenas o corpo da resposta.
- Qualquer nova rota, em qualquer módulo futuro, herda automaticamente o envelope — não exige
  nenhuma configuração adicional por Controller.
- Reverter esse formato de envelope depois que o frontend/integrações dependerem dele exigiria
  uma nova ADR e uma estratégia de versão de contrato (ver `ADR-005-api-versioning-strategy.md`).
