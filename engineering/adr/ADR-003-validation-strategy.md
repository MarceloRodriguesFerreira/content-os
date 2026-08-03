# ADR-003

# Estratégia de Validação

Status: Accepted

---

## Contexto

Após a implementação da autenticação (SPR-007), a aplicação passou a possuir múltiplos DTOs públicos.

Era necessário definir uma estratégia única para validação.

---

## Decisão

Utilizar ValidationPipe global.

Configuração:

- whitelist: true
- forbidNonWhitelisted: true
- transform: true
- enableImplicitConversion: true

Registrado via o token `APP_PIPE` em `AppModule` (não via `app.useGlobalPipes()` imperativo em
`main.ts`) — garante que testes E2E, que constroem a aplicação a partir de `AppModule`
diretamente, tenham o mesmo pipeline de produção sem duplicação manual (ver
`SPR-008-bloco-b-http-pipeline.md`).

---

## Consequências

Todos os endpoints passam a validar automaticamente os DTOs.

Campos desconhecidos serão rejeitados.

Conversões simples serão realizadas automaticamente.

A estratégia passa a ser obrigatória para todos os módulos futuros.
