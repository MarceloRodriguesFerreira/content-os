# ADR-009 — Autorização por Propriedade de Recurso (Ownership)

## Status

Proposed

## Context

`ADR-004` resolveu autorização **por papel** (`RolesGuard`/`@Roles()`): "usuários com papel X
podem acessar esta rota". Isso não resolve autorização **por instância de recurso**: "este
usuário específico pode acessar *este* projeto específico?" — problema que não existia até agora
porque nenhuma entidade de domínio (com dono) existia antes da SPR-009.

Sem essa camada, qualquer usuário autenticado com papel `USER` poderia ler/editar/arquivar o
projeto de qualquer outro usuário só por adivinhar um `id` — uma falha de autorização (não de
autenticação), já que `JwtAuthGuard` (ADR-002) e `RolesGuard` (ADR-004) sozinhos não capturam
esse tipo de regra.

Por afetar diretamente segurança e por ser um padrão que todo agregado com dono (Campanha,
Conteúdo, futuramente) vai precisar repetir, esta decisão é formalizada como ADR.

## Decision

- **Regra:** o dono (`ownerId` do recurso == `sub` do JWT) sempre tem acesso; `ADMIN` e
  `SUPER_ADMIN` sempre têm acesso a qualquer recurso, independente de propriedade. Esta é uma
  decisão nova desta ADR — `ADR-004` decidiu apenas restrição de rota por papel, nunca definiu
  comportamento de papel frente a recursos individuais, porque nenhum recurso com dono existia
  antes desta sprint. Aqui se decide: acesso administrativo irrestrito a instâncias de `Project`.
- **Implementação:** `ProjectOwnershipGuard`, aplicado via `@UseGuards(ProjectOwnershipGuard)` nas
  rotas que operam sobre um projeto específico (`:id` na URL) — não é global, assim como
  `RolesGuard` não é global.
  - Busca o projeto pelo `:id` do path (via `ProjectsRepository`, respeitando o Repository
    Pattern já estabelecido — o guard não acessa Prisma diretamente).
  - Projeto não encontrado → `404 Not Found` (nunca `403` — não revelar a um usuário não-dono que
    o `id` existe; ver "Consequences").
  - Encontrado e (`ownerId === request.user.sub` OU `request.user.role` em
    `[ADMIN, SUPER_ADMIN]`) → permite.
  - Encontrado e nenhuma das condições acima → `403 Forbidden`.
- **Execução após `RolesGuard`:** a ordem de guards por rota é
  `JwtAuthGuard (global) → RolesGuard (se @Roles()) → ProjectOwnershipGuard` — autenticação,
  depois papel, depois posse. Rotas de projeto não usam `@Roles()` nesta sprint (qualquer papel
  autenticado pode ter projetos), então na prática é `JwtAuthGuard → ProjectOwnershipGuard`.
- **Escopo desta ADR:** o guard nesta sprint é específico de `Project`
  (`ProjectOwnershipGuard`), não uma abstração genérica de "ownership" reutilizável entre
  módulos — ver "Future Evolution".

## Consequences

- Toda rota que recebe um `:id` de projeto precisa declarar `@UseGuards(ProjectOwnershipGuard)`
  explicitamente — esquecer isso é um bug de segurança silencioso, então os testes E2E desta
  sprint cobrem explicitamente "usuário B não acessa projeto do usuário A" para cada rota
  (`GET/PATCH/archive/restore`).
- `404` em vez de `403` para recurso de outro dono é uma escolha deliberada de não vazar
  existência de IDs alheios — consistente com práticas de enumeration prevention.
- `GET /v1/projects` (listagem) **não** usa este guard — a query já filtra por `ownerId` na
  origem (ver `ADR-010`), então não há "recurso de outro dono" para bloquear ali.

## Future Evolution

- Quando Campanha (filha de Projeto) for modelada, o mesmo problema se repete um nível abaixo.
  Nesse momento, avaliar extrair um `OwnershipGuard` genérico (parametrizado por
  repository/estratégia de resolução de dono) em vez de duplicar `ProjectOwnershipGuard` para
  cada agregado — não é feito agora porque só existe um consumidor (`Project`), e generalizar sem
  um segundo caso de uso real violaria o mesmo princípio de YAGNI já registrado na `ADR-004`.
- Colaboração multi-usuário em um projeto (`ADR-008`, "fora de escopo") mudaria a regra de
  "dono único" para "lista de colaboradores" — quando isso acontecer, esta ADR é substituída, não
  só estendida, porque a fonte da verdade de "quem pode acessar" deixa de ser um campo simples.
