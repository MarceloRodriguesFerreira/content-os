# ADR-012 — Autorização por Propriedade de Recurso para Content

## Status

Accepted

## Context

`ADR-009` resolveu autorização por propriedade de recurso para `Project` (dono via `ownerId`
próprio, `403` para "existe mas não é seu"). `ADR-011` estendeu o problema para `Campaign`,
primeiro agregado filho sem `ownerId` próprio, introduzindo `404` sempre e a validação de
consistência entre o identificador do pai na rota e o `projectId` real do recurso.

`Content` (SPR-013, Bloco A — `PR #22`, commit `8df7f44`) é o terceiro agregado do domínio e o
primeiro filho de `Campaign`. É também o "terceiro consumidor real" que a seção "Future
Evolution" de `ADR-011` previu como gatilho para reavaliar a extração de um `OwnershipGuard`
genérico. Esta ADR é essa reavaliação — a conclusão, registrada na Decision abaixo, permanece a
mesma de `ADR-011`: adiar a generalização.

`Content` introduz uma variação estrutural adicional em relação a `Campaign`: a cadeia de
ownership tem dois saltos, não um (`Content.campaignId → Campaign.projectId → Project.ownerId`),
e a rota de `Content` (`/v1/campaigns/:campaignId/contents`) não expõe `:projectId` no path —
diferente de `Campaign`, que expõe `:projectId` diretamente. Isso significa que o `projectId`
usado para resolver o `Project` nunca pode vir de um parâmetro de rota (não existe um para
usar) — é sempre o valor persistido em `campaign.projectId`, obtido depois de resolver a
`Campaign`.

## Decision

### 1. Guard específico de módulo — sem abstração compartilhada

`ContentOwnershipGuard` é implementado como guard específico do módulo `content`, mesmo padrão
estrutural de `ProjectOwnershipGuard`/`CampaignOwnershipGuard` (busca via Repository, nunca
acesso direto ao Prisma), como classe independente.

Não são criados, mesmo agora com três consumidores reais (`Project`, `Campaign`, `Content`):

- `OwnershipGuard` genérico ou base class parametrizável;
- `GenericOwnershipGuard` ou `AncestryOwnershipGuard`;
- qualquer helper compartilhado entre os três guards;
- refatoração de `ProjectOwnershipGuard` ou `CampaignOwnershipGuard` para uma interface comum.

Reavaliação explícita do gatilho deixado em aberto por `ADR-011`: mesmo com três consumidores
concretos, eles continuam divergindo em forma o suficiente para tornar prematura uma
generalização — `Project` resolve ownership diretamente por `ownerId` próprio; `Campaign` resolve
por um pai, com um salto; `Content` resolve por um avô, com dois saltos, e sem `:projectId` na
própria rota (o que muda de onde vem o identificador usado para a busca final de `Project`). Uma
abstração construída a partir desses três formatos ainda seria moldada por generalização
especulativa, não por um padrão estável observado — mesmo critério de YAGNI já aplicado em
`ADR-004`, `ADR-009` e `ADR-011`. Esta decisão está fechada para o escopo desta sprint.

### 2. Falha de ownership de Content retorna sempre `404 Not Found`

Mesmo contrato de `ADR-011` para `Campaign`, estendido para `Content`:

| Cenário                                                              | `Content` (`ADR-012`) |
| ---------------------------------------------------------------------- | ----------------------- |
| `Content` inexistente                                                  | `404 Not Found`          |
| `Content` inconsistente com `:campaignId` da rota                      | `404 Not Found`          |
| `Campaign` inexistente                                                 | `404 Not Found`          |
| `Project` (avô, via `campaign.projectId`) inexistente                  | `404 Not Found`          |
| `Project` existente, de outro usuário (sem papel admin)                | `404 Not Found`          |

`ContentOwnershipGuard` **nunca** lança `403 Forbidden`. Mesma justificativa de `ADR-011`: reduzir
a superfície de enumeração para um recurso sem `ownerId` próprio, cuja existência de qualquer
elo da cadeia (`Content`, `Campaign`, `Project`) não deve ser confirmada a um usuário não
autorizado.

### 3. Cadeia de ownership e origem do `projectId`

A ownership de `Content` é derivada exclusivamente por:

```
Content.campaignId → Campaign.projectId → Project.ownerId
```

`Content` não possui `ownerId` próprio. O `projectId` usado para buscar o `Project` é sempre
`campaign.projectId` — o valor persistido, obtido depois de resolver a `Campaign` real pelo seu
`id`. Nunca um `projectId` enviado pelo cliente, nem qualquer campo HTTP não persistido: a rota
de `Content` não expõe `:projectId` no path, então não há parâmetro de URL disponível para essa
finalidade, mesmo que houvesse, ele não seria a fonte de verdade.

### 4. Rotas com `:campaignId` e `:id` — ordem de validação obrigatória

Quando a rota expõe simultaneamente `:campaignId` e `:id` (path de conteúdo específico — `GET`,
`PATCH`, `POST .../archive`), `ContentOwnershipGuard` executa, nesta ordem:

1. Busca `Content` por `params.id` via `ContentsRepository.findById`.
   - Não encontrado → `404 Not Found`. Encerra aqui.
2. Valida `content.campaignId === params.campaignId`.
   - Inconsistente → `404 Not Found`. Encerra aqui.
3. Busca `Campaign` por `params.campaignId` via `CampaignsRepository.findById`.
   - Não encontrada → `404 Not Found`.
4. Obtém `projectId` exclusivamente de `campaign.projectId` e busca `Project` via
   `ProjectsRepository.findById`.
   - Não encontrado → `404 Not Found`.
5. Autoriza se `project.ownerId === request.user.sub` OU `request.user.role` em
   `[ADMIN, SUPER_ADMIN]`; caso contrário, `404 Not Found`.

Quando a rota expõe apenas `:campaignId` (`POST` de criação, `GET` de listagem — sem `:id`), os
passos 1 e 2 são pulados; o guard resolve autorização diretamente a partir da `Campaign` (passos
3 a 5).

A validação do passo 2 é obrigatória pelo mesmo motivo estabelecido em `ADR-011` seção 3: sem
ela, um usuário dono de alguma campanha poderia montar uma URL com o seu próprio `campaignId`
(que passaria a checagem de ownership da cadeia) combinado com o `id` de um conteúdo pertencente
a uma campanha de outro usuário — uma falha de IDOR.

### Execução na cadeia de guards

Mesma posição relativa de `ADR-009`/`ADR-011`: `JwtAuthGuard (global) → RolesGuard (se
@Roles()) → ContentOwnershipGuard`. Rotas de conteúdo não usam `@Roles()` nesta sprint (mesmo
critério já aplicado a `Project`/`Campaign`), portanto, na prática, `JwtAuthGuard →
ContentOwnershipGuard`.

### Estados e ciclo de vida (referência, não decisão de autorização)

`Content` tem dois estados: `ACTIVE` (inicial) e `ARCHIVED` (terminal nesta sprint — sem
`restore`, sem `DELETE` físico). Não são criados estados adicionais. Esta seção é apenas
referência — a decisão de ciclo de vida pertence ao Design Doc (`SPR-013-content-domain.md`),
não a esta ADR, que cobre exclusivamente autorização.

### Escopo desta ADR

Cobre exclusivamente a autorização de `Content` implementada por `ContentOwnershipGuard`
(SPR-013, Bloco B). Não define Controller, rotas HTTP, DTOs ou Swagger — isso permanece de
responsabilidade do Bloco C. `ContentsService` não realiza nenhuma verificação de ownership; essa
responsabilidade é exclusiva do guard, mesmo princípio de separação já estabelecido para
`Project`/`Campaign`.

## Consequences

- Toda rota de `Content` que recebe `:campaignId` (e, quando aplicável, `:id`) precisa declarar
  `@UseGuards(ContentOwnershipGuard)` explicitamente — esquecer isso é um bug de segurança
  silencioso, mesmo risco documentado em `ADR-009`/`ADR-011`. Testes E2E do Bloco C devem cobrir
  explicitamente "usuário B não acessa conteúdo de campanha do usuário A" e "usuário não acessa
  conteúdo real referenciado com `campaignId` de outra campanha sua" para cada rota.
- `ContentOwnershipGuard` faz, no pior caso (rota com `:id`), três consultas sequenciais
  (`ContentsRepository.findById` → `CampaignsRepository.findById` → `ProjectsRepository.findById`)
  em vez de uma — custo aceito em troca da proteção contra IDOR da seção 4, mesma lógica de custo
  aceito já registrada em `ADR-011`. Não é otimizado nesta ADR (decisão de implementação do
  Bloco B, não de arquitetura).
- Três ADRs (`ADR-009`, `ADR-011`, `ADR-012`) descrevem, deliberadamente, contratos HTTP
  diferentes para os três guards de ownership do monorepo — intencional, documentado, não uma
  inconsistência a corrigir por unificação silenciosa.

## Future Evolution

- Se um quarto agregado com ownership derivada de um ancestral for modelado (ex.: `Publicação`,
  filha de `Content` — quatro saltos até `Project`), reavaliar novamente a extração de um guard
  genérico, agora com quatro consumidores reais para basear a generalização em padrão observado,
  não em antecipação. Mesmo critério de adiamento já registrado duas vezes (`ADR-011`, esta ADR).
- Se a decisão de `404`-sempre para `Content` se mostrar insuficiente para algum caso de uso
  legítimo, a revisão é uma nova ADR que substitui esta seção, não uma alteração implícita no
  código do guard.
- Mesma dependência estrutural já registrada em `ADR-011`: alterações na noção de "dono" de
  `Project` (ex.: colaboração multi-usuário, `ADR-008`, fora de escopo) exigem revisão conjunta
  de `ADR-009`, `ADR-011` e desta ADR, já que `Content` depende estruturalmente das duas.
