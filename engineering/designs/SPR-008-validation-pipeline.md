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

# Fora de Escopo

- Exception Filters
- Rate Limiter
- Interceptors
- Serialization

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
