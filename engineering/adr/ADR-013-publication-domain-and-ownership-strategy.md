# ADR-013 — Estratégia de Domínio e Ownership para Publication

## Status

Accepted

## Context

`ADR-009`, `ADR-011` e `ADR-012` resolveram, em sequência, autorização por propriedade de
recurso para `Project` (ownership direto), `Campaign` (primeiro filho sem `ownerId` próprio,
`404` sempre) e `Content` (segundo filho derivado, dois saltos até `Project`). `ADR-012`, na
seção "Future Evolution", já antecipava este momento: *"se um quarto agregado com ownership
derivada de um ancestral for modelado (ex. `Publicação`, filha de `Content`)... reavaliar
novamente a extração de um guard genérico, agora com quatro consumidores reais."* Esta ADR é
essa reavaliação, e também a primeira ADR deste projeto a registrar, no mesmo documento,
decisões de modelagem de domínio (cardinalidade, canal, ciclo de vida) e a decisão de ownership
— um formato distinto de `ADR-009`/`ADR-011`/`ADR-012` (exclusivamente ownership), porque
`Publication` introduz decisões de domínio novas o suficiente (canal externo, agendamento) para
não caberem só no Design Doc sem registro formal de porquê cada uma foi ou não incluída nesta
sprint.

`Publication` é o quarto agregado do domínio, filho de `Content`:

```
Project → Campaign → Content → Publication
```

Diferente de `Content` (que introduziu o segundo salto de derivação), `Publication` não introduz
nenhum salto estrutural novo em relação ao guard — o padrão de "recurso sem `ownerId` próprio,
resolvido por um ancestral" já é conhecido desde `ADR-011`. O que `Publication` introduz de
genuinamente novo é a proximidade com um sistema externo (rede social) ainda não integrado a
este projeto, o que exige decidir explicitamente **onde a fronteira da sprint termina**.

## Decision

### 1. Cardinalidade — Content → Publication é 1:N

Um `Content` pode ter várias `Publication`s associadas, sem restrição de unicidade sobre
`Publication.contentId`. Isso permite, desde já, o caso de uma mesma peça de conteúdo ser
publicada em múltiplos canais (ou reagendada), sem exigir migração de schema quando o produto
evoluir para múltiplas redes sociais — alinhado ao pilar de "Reutilização" e ao objetivo de
"múltiplas redes sociais" já registrados em `VISION.md`. Modelar como 1:1 agora e migrar depois
seria o tipo de retrabalho estrutural que este projeto tem evitado ao decidir a forma da relação
antes de implementar (mesmo critério já aplicado à ausência de `ownerId` em `Campaign`/`Content`,
decidida em `ADR-008`/design docs correspondentes antes da implementação).

### 2. Ownership — derivada, sem `ownerId` próprio

```
Publication.contentId → Content.campaignId → Campaign.projectId → Project.ownerId
```

`Publication` não possui `ownerId` próprio, mesmo critério já estabelecido para `Campaign`
(`ADR-011`) e `Content` (`ADR-012`).

### 3. Guard específico de módulo — sem abstração compartilhada (quarta reavaliação)

`PublicationOwnershipGuard` é implementado como guard específico do módulo `publication`, mesmo
padrão estrutural dos três guards anteriores (busca via Repository, nunca acesso direto ao
Prisma), como classe independente.

Não são criados, mesmo agora com quatro consumidores reais (`Project`, `Campaign`, `Content`,
`Publication`):

- `OwnershipGuard` genérico ou base class parametrizável;
- qualquer helper compartilhado entre os quatro guards;
- refatoração de qualquer guard existente para uma interface comum.

**Reavaliação explícita do gatilho deixado em aberto por `ADR-012`.** Esta é a primeira vez, nas
quatro ADRs de ownership deste projeto, em que o argumento a favor da generalização fica
genuinamente mais forte que nas anteriores: os quatro guards formam uma progressão regular (0, 1,
2, 3 saltos ancestrais, sempre terminando em `Project.ownerId`, os três derivados sempre
retornando `404`). Ainda assim, a decisão é **adiar novamente**, por dois motivos:

1. `Project` continua divergindo em contrato HTTP (`403`, não `404`) dos outros três — uma
   abstração genérica precisaria decidir explicitamente se cobre `Project` (acomodando essa
   exceção) ou só os três derivados, decisão que nenhum ADR anterior tomou e que não deve ser
   resolvida implicitamente dentro desta ADR de `Publication`.
2. Ainda não existe experiência real de manutenção com quatro guards concretos — extrair a
   abstração antes dessa experiência é generalizar por padrão observado na forma, não por dor
   real de duplicação sentida ao evoluir o código. Mesmo critério de YAGNI já aplicado em
   `ADR-004`, `ADR-009`, `ADR-011` e `ADR-012`.

A generalização **pode** ser reconsiderada após experiência real de manutenção com os quatro
guards concretos — não está descartada em definitivo, apenas adiada, mesma natureza de adiamento
já registrada duas vezes antes desta ADR.

### 4. Falha de ownership retorna sempre `404 Not Found`

Mesmo contrato de `ADR-011`/`ADR-012`, estendido para `Publication`: `Publication` inexistente,
`Publication` inconsistente com `:contentId` da rota, `Content`/`Campaign`/`Project` ausentes em
qualquer ponto da cadeia, ou `Project` de outro usuário sem papel administrativo — todos
retornam `404`, nunca `403`. Mesma justificativa: reduzir superfície de enumeração para um
recurso sem `ownerId` próprio.

### 5. Canal — `enum PublicationChannel`

Canal é modelado como enum Prisma, mesmo padrão de `ContentStatus`/`CampaignStatus`. Nesta
sprint, o enum contém exclusivamente `INSTAGRAM` — o único canal citado nominalmente em
`VISION.md`. Nenhum outro valor é adicionado especulativamente; o enum é extensível por natureza
(novos valores adicionados quando um novo canal for de fato priorizado), sem necessidade de
migração estrutural, só de uma nova migration adicionando o valor. Não é criada uma entidade
`Channel` própria (com conta/credenciais) nesta sprint — isso só se justifica quando a
integração externa real (fora de escopo, ver seção 7) for priorizada.

### 6. Status e ciclo de vida — apenas `DRAFT` e `SCHEDULED`

```
DRAFT ⇄ SCHEDULED
```

- `DRAFT`: estado inicial. `scheduledAt` pode ser nulo.
- `SCHEDULED`: exige `scheduledAt` preenchido e no futuro (validação de domínio: `scheduledAt`
  não pode estar no passado no momento da transição).
- `SCHEDULED → DRAFT`: transição de desagendamento/cancelamento. Ao voltar para `DRAFT`,
  `scheduledAt` é obrigatoriamente limpo (`null`).
- Não são criados `PUBLISHED`, `FAILED` ou `RETRYING` nesta sprint — todos dependem de uma
  execução real que este projeto ainda não possui (nenhuma dependência de fila/scheduler/worker
  existe no monorepo). Criar esses estados agora produziria estados sem nenhum caminho de código
  que os alcance, risco de modelagem prematura já evitado sistematicamente neste projeto.

### 7. Fora de escopo — agendamento real, integração externa, payload, retry/histórico

Fronteira explícita desta sprint, decidida por camada:

- **Camada A (modelo de domínio) — dentro da SPR-014.** `scheduledAt` existe como dado
  persistido; nada o executa.
- **Camada B (agendamento/orquestração) — fora, sprint própria.** Nenhum worker, fila ou cron é
  criado. Não existe hoje nenhuma infraestrutura desse tipo no projeto — é uma categoria de
  infraestrutura nova, não uma extensão do padrão de domínio já seguido três vezes.
- **Camada C (integração externa) — fora, sprint própria, possivelmente com ADR dedicado.**
  Nenhuma chamada a API do Instagram/Meta, nenhum OAuth, nenhum tratamento de erro de rede
  externa. `VISION.md` cita "Integração Instagram" como funcionalidade de MVP, mas nenhum
  documento define estratégia de credenciais/tokens — escopo grande o suficiente para merecer
  Design Freeze próprio.
- **Payload/snapshot específico de canal — não decidido nesta sprint.** Não é criado nenhum
  campo de payload renderizado ou snapshot do `Content` no momento do agendamento. A escolha
  entre snapshot (preserva o texto de quando foi agendado) e leitura ao vivo de `Content.body`
  é um trade-off real, mas só pode ser decidido quando a execução real (Camada C) definir se o
  fluxo é síncrono, humano ou assíncrono. Fica registrado como decisão adiada, não fechada.
- **`PublicationAttempt` / retry / idempotência / histórico de tentativas — fora de escopo.**
  Nenhum desses conceitos tem sentido sem execução real. Não são criadas tabelas ou campos para
  eles nesta sprint.

## Consequences

- Toda rota de `Publication` que recebe `:contentId` (e, quando aplicável, `:id`) precisa
  declarar `@UseGuards(PublicationOwnershipGuard)` explicitamente — mesmo risco de bug de
  segurança silencioso já documentado em `ADR-009`/`ADR-011`/`ADR-012`. Testes E2E do Bloco C
  devem cobrir "usuário B não acessa publication de content do usuário A" e inconsistência de
  `:contentId` com IDOR, mesmo padrão das três ADRs anteriores.
- `PublicationOwnershipGuard` faz, no pior caso, quatro consultas sequenciais
  (`PublicationsRepository` → `ContentsRepository` → `CampaignsRepository` →
  `ProjectsRepository`) — custo aceito pelo mesmo motivo já registrado em `ADR-011`/`ADR-012`.
- Quatro ADRs (`ADR-009`, `ADR-011`, `ADR-012`, esta) descrevem, deliberadamente, contratos HTTP
  distintos entre `Project` e os três agregados derivados — intencional, documentado, não uma
  inconsistência a corrigir.
- Uma `Publication` criada nesta sprint não produz nenhum efeito real fora do banco de dados —
  isso deve estar explícito no Design Doc e na API (Swagger) para não sugerir a um consumidor da
  API que algo foi de fato publicado em uma rede social.

## Future Evolution

- Quando a Camada C (integração externa) for priorizada, os estados `PUBLISHED`/`FAILED` e a
  decisão de payload/snapshot (seção 7) precisam ser fechados — nesta ADR ficam deliberadamente
  em aberto, não decididos por omissão.
- Quando a Camada B (agendamento real) for priorizada, `scheduledAt` passa a ter um consumidor
  real (worker/scheduler) — nenhuma mudança de schema é esperada, apenas novo código orquestrador
  lendo o campo já existente.
- A decisão de guard genérico (seção 3) pode ser reconsiderada após experiência real de
  manutenção com os quatro guards concretos, ou quando um quinto agregado com ownership derivada
  for modelado — critério de reavaliação análogo ao já usado nas três ADRs anteriores.
- Se um novo canal for priorizado, adicionar ao `enum PublicationChannel` via migration — não
  requer nova ADR, salvo se o novo canal exigir campos ou regras de domínio específicas que não
  se encaixem no modelo genérico atual.
