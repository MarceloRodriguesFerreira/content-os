# ADR-011 — Autorização por Propriedade de Recurso para Campaign

## Status

Accepted

## Context

`ADR-009` resolveu autorização por propriedade de recurso para `Project`: dono (`ownerId ===
request.user.sub`) sempre tem acesso; `ADMIN`/`SUPER_ADMIN` sempre têm acesso; qualquer outra
condição resulta em `404 Not Found`, nunca `403 Forbidden`, para não revelar a um usuário
não-dono que um `id` alheio existe.

`Campaign` (SPR-012, Bloco A — `PR #17`) é o primeiro agregado filho de `Project` a exigir o
mesmo tipo de controle, mas com uma diferença estrutural que `ADR-009` não cobre: `Campaign` não
possui `ownerId` próprio (decisão de `ADR-008`/design doc do SPR-012 — a posse é derivada
exclusivamente de `Campaign.projectId → Project.ownerId`). Isso introduz duas questões que
`ProjectOwnershipGuard` nunca precisou resolver, por operar sobre um único nível de recurso:

1. A autorização não pode ser resolvida só pelo recurso da rota (`Campaign`) — precisa
   necessariamente atravessar o `Project` pai.
2. Rotas de `Campaign` aninhadas sob `/v1/projects/:projectId/campaigns` carregam dois
   identificadores de path simultâneos (`:projectId` e `:id`), o que abre uma superfície de
   inconsistência inexistente em `Project` — um usuário poderia, em tese, referenciar um `:id`
   de campanha real acompanhado de um `:projectId` diferente do `projectId` real dessa campanha.

`ADR-009`, na seção "Future Evolution", já antecipava este momento — "quando Campanha (filha de
Projeto) for modelada, o mesmo problema se repete um nível abaixo" — e sugeria então avaliar a
extração de um `OwnershipGuard` genérico. Esta ADR é essa avaliação: a conclusão, registrada na
Decision abaixo, é adiar a generalização (ver "Guard específico de módulo").

Por afetar diretamente segurança, por introduzir uma divergência de comportamento HTTP em
relação a um ADR já aceito (`ADR-009`), e por ser precedente para todo agregado futuro com
ownership derivado de um pai (ex.: Conteúdo, filho de Campaign), esta decisão é formalizada como
ADR — mesmo critério de materialidade já aplicado em `ADR-009`.

## Decision

### 1. Guard específico de módulo — sem abstração compartilhada com `ProjectOwnershipGuard`

`CampaignOwnershipGuard` é implementado como guard específico do módulo `campaigns`, seguindo o
mesmo padrão estrutural de `ProjectOwnershipGuard` (busca via Repository, nunca acesso direto ao
Prisma), mas como uma classe independente — não uma especialização, subclasse ou consumidor de
uma abstração genérica de ownership.

Não são criados neste momento:

- `OwnershipGuard` genérico ou base class parametrizável por repository/estratégia de resolução
  de dono;
- qualquer helper ou utilitário compartilhado entre `ProjectOwnershipGuard` e
  `CampaignOwnershipGuard`;
- refatoração de `ProjectOwnershipGuard` para se adequar a uma interface comum.

Isso é a mesma aplicação de YAGNI já registrada em `ADR-004` e citada em `ADR-009`: uma
abstração generalizada a partir de dois consumidores concretos (`Project`, `Campaign`) que ainda
divergem em forma — `Project` resolve ownership diretamente por `ownerId` no próprio recurso;
`Campaign` resolve por um recurso pai, com uma validação de consistência adicional (seção 3) que
`Project` nunca teve — tende a produzir uma interface prematura, moldada por generalização
especulativa em vez de por necessidade real repetida. A extração de uma abstração compartilhada
fica formalmente adiada para quando um terceiro consumidor real (ex.: `Content`, filho de
`Campaign`) tornar o padrão de "ownership por ancestral" estável o suficiente para generalizar
sem adivinhação — ver "Future Evolution".

### 2. Falha de ownership de Campaign retorna sempre `404 Not Found`

**`ADR-009` não é alterada por esta decisão e continua integralmente válida.** O comportamento
de `ProjectOwnershipGuard` permanece exatamente o mesmo descrito em `ADR-009` — nenhuma linha
deste ADR muda isso. A tabela abaixo deixa os dois contratos lado a lado, exatamente como cada
um já é (`ADR-009`) ou passa a ser (`ADR-011`):

| Cenário                                                          | `Project` (`ADR-009`) | `Campaign` (`ADR-011`) |
| ----------------------------------------------------------------- | ---------------------- | ----------------------- |
| Recurso inexistente                                                | `404 Not Found`        | `404 Not Found`          |
| Recurso existente, pertencente a outro usuário (sem papel admin)   | `403 Forbidden`        | `404 Not Found`          |
| Recurso pai (`Project`) inexistente                                | não se aplica          | `404 Not Found`          |
| Recurso pai (`Project`) existente, de outro usuário (sem papel admin) | não se aplica       | `404 Not Found`          |
| `Campaign` inconsistente com `:projectId` da rota                  | não se aplica          | `404 Not Found`          |

`CampaignOwnershipGuard` **nunca** lança `403 Forbidden`, em nenhum dos cinco cenários acima.

**Isto é uma divergência consciente e localizada em relação a `ADR-009`, não uma correção ou
substituição dela.** `ADR-009` estabelece o contrato de `Project`, um recurso de primeiro nível;
`ADR-011` estabelece um contrato próprio e específico para `Campaign`, um recurso filho, sem
alterar, revisar ou reinterpretar `ADR-009`. Não há intenção de uniformizar os dois guards nem de
propagar o comportamento de `Campaign` de volta para `Project` — `ProjectOwnershipGuard`
continua, e deve continuar, retornando `403` para "existente mas de outro dono", exatamente como
`ADR-009` define.

Justificativa da divergência: `Campaign` é um recurso de segundo nível, referenciado por um `id`
próprio dentro de uma rota que já expõe `:projectId` no path. Retornar `403` para uma `Campaign`
de outro dono confirmaria a um usuário não autorizado não apenas que aquele `id` de campanha
existe, mas indiretamente exercita a relação `campaign.projectId`, aumentando a superfície de
enumeração em relação ao caso de `Project` (recurso de primeiro nível, sem relação de
pertencimento a confirmar). Reduzir essa exposição, adotando `404` para todo caso de falha de
ownership de `Campaign` — inexistência da própria campanha, inconsistência com o projeto do path,
ou falta de ownership do projeto pai —, é a motivação central desta ADR.

### 3. Rotas com `:projectId` e `:id` — ordem de validação obrigatória

Quando a rota expõe simultaneamente `:projectId` e `:id` (path de campanha específica — `GET`,
`PATCH`, `POST .../archive`), `CampaignOwnershipGuard` executa, nesta ordem:

1. Busca `Campaign` por `params.id` via `CampaignsRepository.findById`.
   - Não encontrada → `404 Not Found`. Encerra aqui — não prossegue para os passos seguintes.
2. Valida `campaign.projectId === params.projectId`.
   - Inconsistente → `404 Not Found`. Encerra aqui.
3. Busca `Project` por `params.projectId` (que, após o passo 2, é garantidamente o `projectId`
   real da campanha) via `ProjectsRepository.findById`.
   - Não encontrado → `404 Not Found`.
4. Autoriza se `project.ownerId === request.user.sub` OU `request.user.role` em
   `[ADMIN, SUPER_ADMIN]`; caso contrário, `404 Not Found`.

Quando a rota expõe apenas `:projectId` (`POST` de criação, `GET` de listagem — sem `:id`), os
passos 1 e 2 são pulados; o guard resolve autorização diretamente a partir do `Project` (passos
3 e 4).

A validação do passo 2 é obrigatória e não pode ser substituída por confiar apenas em
`params.projectId` sem checar a campanha primeiro: sem ela, um usuário dono de *algum* projeto
poderia montar uma URL com o seu próprio `projectId` (que passaria a checagem de ownership do
`Project`) combinado com o `id` de uma campanha pertencente a um projeto de outro usuário,
obtendo acesso indevido a essa campanha — uma falha de autorização por referência insegura a
objeto (IDOR) que `ADR-009` nunca precisou considerar, por `Project` não ter um recurso pai
intermediário no path.

### Execução na cadeia de guards

Mesma posição relativa de `ADR-009`: `JwtAuthGuard (global) → RolesGuard (se @Roles()) →
CampaignOwnershipGuard`. Rotas de campanha não usam `@Roles()` nesta sprint (mesmo critério já
aplicado a `Project`), portanto, na prática, `JwtAuthGuard → CampaignOwnershipGuard`.

### Escopo desta ADR

Cobre exclusivamente a autorização de `Campaign` implementada por `CampaignOwnershipGuard`
(SPR-012, Bloco B). Não define Controller, rotas HTTP, DTOs ou Swagger — isso permanece de
responsabilidade do Bloco C. `CampaignsService` não realiza nenhuma verificação de ownership;
essa responsabilidade é exclusiva do guard, mesmo princípio de separação já estabelecido para
`ProjectsService`/`ProjectOwnershipGuard`.

## Consequences

- Toda rota de `Campaign` que recebe `:projectId` (e, quando aplicável, `:id`) precisa declarar
  `@UseGuards(CampaignOwnershipGuard)` explicitamente — esquecer isso é um bug de segurança
  silencioso, mesmo risco já documentado em `ADR-009` para `Project`. Testes E2E do Bloco C
  devem cobrir explicitamente "usuário B não acessa campanha de projeto do usuário A" e "usuário
  não acessa campanha real referenciada com `projectId` de outro projeto seu" para cada rota.
- Duas ADRs (`ADR-009`, `ADR-011`) descrevem, deliberadamente, dois contratos HTTP diferentes
  (`403` vs. `404` para "existe mas não é seu") para dois guards de ownership no mesmo
  monorepo. Isso deve ser tratado como intencional e documentado, não como inconsistência a
  "corrigir" por unificação silenciosa em uma revisão futura.
- `CampaignOwnershipGuard` faz, no pior caso (rota com `:id`), duas consultas sequenciais
  (`CampaignsRepository.findById` seguida de `ProjectsRepository.findById`) em vez de uma —
  custo aceito em troca da proteção contra IDOR da seção 3; não é otimizado (ex.: `include` de
  `project` na própria query de `Campaign`) nesta ADR, por ser decisão de implementação do
  Bloco B, não de arquitetura.
- `GET /v1/projects/:projectId/campaigns` (listagem) usa o guard normalmente (diferente do caso
  `GET /v1/projects`, que não usa `ProjectOwnershipGuard` por já filtrar por `ownerId` na
  origem) — a listagem de campanhas depende de autorização sobre o `Project` pai antes de
  filtrar por `projectId`, já que `Campaign` não tem `ownerId` próprio para autofiltrar a query
  da mesma forma.

## Future Evolution

- Se um terceiro agregado com ownership derivado de um ancestral for modelado (ex.: `Content`,
  filho de `Campaign`), reavaliar a extração de um guard genérico parametrizado por
  repository/estratégia de resolução de dono, agora com dois consumidores reais divergentes
  (`Campaign`: um nível de ancestralidade; um hipotético terceiro agregado: potencialmente dois
  níveis) para basear a generalização em necessidade observada, não em antecipação.
- Se a decisão de `404`-sempre para `Campaign` se mostrar, na prática, insuficiente para algum
  caso de uso legítimo (ex.: mensagens de erro mais específicas para o próprio dono em cenários
  de suporte), a revisão é uma nova ADR que substitui esta seção, não uma alteração implícita no
  código do guard.
- Colaboração multi-usuário em um projeto (`ADR-008`, fora de escopo) alteraria a própria noção
  de "dono" de `Project`, e por extensão a base sobre a qual `CampaignOwnershipGuard` resolve
  ownership de `Campaign` — quando isso acontecer, tanto esta ADR quanto `ADR-009` precisam ser
  revisadas em conjunto, já que `Campaign` depende estruturalmente da definição de ownership de
  `Project`.
