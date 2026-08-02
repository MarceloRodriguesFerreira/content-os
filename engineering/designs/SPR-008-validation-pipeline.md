# SPR-008 — Validation Pipeline

Status: Proposed

## Objetivo

Implementar a camada oficial de validação de entrada do Content-OS utilizando ValidationPipe global do NestJS.

Esta sprint conclui a pendência registrada na SPR-005 e elevada de prioridade na SPR-007.

---

# Escopo

## Implementar

- ValidationPipe global
- whitelist
- forbidNonWhitelisted
- transform
- transformOptions
- enableImplicitConversion

---

# Fora de Escopo (deste documento)

Este documento cobre exclusivamente o `ValidationPipe`. As demais peças do HTTP Pipeline
passaram a fazer parte da SPR-008 (Bloco B), com design próprio, e portanto não estão mais
fora do escopo da sprint — apenas fora do escopo *deste* documento:

- Exception Filters — design doc próprio, a ser criado no início do Bloco B
- Interceptors (Response/Error Envelope) — design doc próprio, a ser criado no início do Bloco B
- Rate Limiter — permanece fora de escopo do produto nesta sprint
- Serialization (`class-transformer` `@Exclude`/`@Expose` avançado) — permanece fora de escopo

---

# Critérios de Aceite

Todos os DTOs existentes devem ser automaticamente validados.

As seguintes rotas devem permanecer funcionais:

- POST /auth/login
- POST /auth/refresh
- GET /users/me
- GET /health

---

# Testes

Devem existir testes para:

- campo obrigatório
- tipo inválido
- campo desconhecido
- transformação automática
