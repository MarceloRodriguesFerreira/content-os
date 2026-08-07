# ADR-010 — Convenções REST para Recursos de Domínio

## Status

Accepted

## Context

Até a SPR-008, a API só tinha endpoints singulares (`/auth/login`, `/users/me`) — nenhum
endpoint de listagem existia, então nunca foi preciso decidir paginação, filtros ou convenções de
DTO para coleções. `Project` é o primeiro recurso a expor uma listagem (`GET /v1/projects`).

Como todo agregado de domínio futuro (Campanha, Conteúdo, Publicação) vai expor listagens
semelhantes, esta decisão é formalizada como ADR — é exatamente o tipo de "padrão que vale para
todo o projeto" que justifica uma ADR pelo critério do `ENGINEERING_GUIDE.md`, e é cara de mudar
depois que múltiplos módulos já dependerem de um formato.

## Decision

### Paginação — offset-based (`page`/`limit`), não cursor-based

- Query params: `page` (inteiro, mínimo 1, padrão 1), `limit` (inteiro, mínimo 1, máximo 100,
  padrão 20).
- **Motivo:** paginação por cursor resolve problemas de escala (páginas profundas, inserções
  concorrentes) que não existem no perfil de uso atual — listas por usuário, tipicamente
  pequenas. Offset-based é mais simples de implementar, testar e documentar. Se o volume por
  usuário crescer a um ponto que isso vire problema real, essa é uma decisão que se revisita com
  dados em mãos (novo gatilho, nova ADR) — YAGNI.
- Formato de resposta (dentro do envelope de sucesso já estabelecido pela `ADR-007`):
  ```json
  {
    "success": true,
    "data": {
      "items": [ /* ProjectResponseDto[] */ ],
      "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
    },
    "timestamp": "..."
  }
  ```

### Filtros — query params simples, sem linguagem de query genérica

- Cada módulo declara explicitamente quais campos são filtráveis (para `Project`: `status`).
- **Rejeitado:** filtros genéricos estilo `?filter[field][operator]=value` ou linguagem de query
  livre — YAGNI; nenhum consumidor real precisa disso hoje, e adicionar depois é aditivo.

### Ordenação

- Fora de escopo nesta sprint para `Project` — a listagem ordena por `createdAt desc` (mais
  recente primeiro), fixo, sem parâmetro de ordenação customizável. Adicionar `sort`/`order`
  como query params é aditivo quando houver necessidade real.

### DTOs de entrada — convenção reafirmada (já em uso desde a SPR-007/008)

- Todo campo de DTO de entrada tem ao menos um decorator do `class-validator` (obrigatório para
  `whitelist: true` do `ValidationPipe`, `ADR-003`, não remover campos silenciosamente).
- DTOs de query (paginação/filtro) seguem a mesma regra — `@IsOptional()` + `@Type(() => Number)`
  para campos numéricos vindos de query string (o `ValidationPipe` já tem
  `enableImplicitConversion: true`, mas listas/números em query strings ainda se beneficiam de
  `@Type()` explícito para clareza e para funcionar de forma previsível independente da
  configuração global).

### DTOs de saída — convenção reafirmada

- Mesma convenção de `UserResponseDto`/`HealthResponseDto`: classe com `@ApiProperty()` em cada
  campo, nunca reexportar o model do Prisma diretamente na resposta HTTP.

## Consequences

- A **convenção** (formato `page`/`limit`, formato `{ items, meta }`, regras de filtro) é
  reutilizada por todo módulo de domínio futuro com listagem — mas cada módulo declara sua
  própria classe de DTO de query (`ListProjectsQueryDto` para `Project`, equivalente para
  Campanha/Conteúdo no futuro), seguindo a mesma lógica de YAGNI já registrada na `ADR-009` para
  o `OwnershipGuard`: não existe ainda um segundo consumidor real que justifique extrair uma
  classe de DTO de query compartilhada. Isso pode mudar quando um segundo módulo de listagem for
  implementado.
- Exceção: `PaginatedResponseDto<T>` (o wrapper de saída `{ items, meta }`) **é** genérico e
  compartilhado desde já (`common/dto/`) — diferente do DTO de entrada, um tipo genérico
  parametrizado não duplica código por módulo, então não há o mesmo custo de abstração prematura
  que motivou manter o DTO de query e o guard específicos por módulo.
- Se algum agregado futuro precisar de paginação por cursor por razão concreta (ex.: feed de
  atividades de alto volume), essa exceção é documentada pontualmente, sem reabrir esta ADR para
  os demais módulos.
