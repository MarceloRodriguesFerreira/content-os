# ADR-003

# Estratégia de Validação

Status: Proposed

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

---

## Consequências

Todos os endpoints passam a validar automaticamente os DTOs.

Campos desconhecidos serão rejeitados.

Conversões simples serão realizadas automaticamente.

A estratégia passa a ser obrigatória para todos os módulos futuros.
