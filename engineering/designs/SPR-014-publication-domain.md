# SPR-014 — Domínio: Publication (Design Doc)

Status: Accepted

## Contexto

`Publication` é o quarto agregado do domínio de negócio do Content-OS, filho de `Content`,
fechando a hierarquia iniciada na SPR-009 (`Project`), continuada na SPR-012 (`Campaign`) e na
SPR-013 (`Content`):

```
Project → Campaign → Content → Publication
```

Citada nominalmente como "sprint futura" no Design Doc e no backlog da SPR-013, e antecipada
como gatilho de reavaliação arquitetural na seção "Future Evolution" de `ADR-012`.

## Objetivo

Modelar `Publication` como registro de **intenção** de publicação de um `Content` em um canal
externo — sem executar nenhuma publicação real. Esta sprint entrega persistência, regras de
lifecycle, ownership e uma API REST completa para criar/consultar/atualizar esse registro. Não
entrega nenhum efeito fora do banco de dados: nenhuma chamada de rede a serviço externo, nenhum
agendamento executado de fato.

Decisões de arquitetura: `ADR-013-publication-domain-and-ownership-strategy.md`.

Segue o mesmo padrão de execução incremental por blocos adotado nas SPR-008, SPR-009, SPR-012 e
SPR-013: cada bloco termina com lint, testes, build, relatório técnico, e aguarda aprovação antes
do próximo.

**Mesma diferença estrutural já registrada nas sprints anteriores:** `PublicationsController` só
passa a existir no Bloco C — não há superfície HTTP para exercitar via E2E antes disso. Testes
E2E completos ficam concentrados no Bloco C; Blocos A e B são cobertos por testes unitários
(Repository, Service, Guard isolados).

**Ownership derivada:**

```
Publication.contentId → Content.campaignId → Campaign.projectId → Project.ownerId
```

`Publication` não possui `ownerId` próprio. Ver `ADR-013` para a análise completa, incluindo a
quarta reavaliação da extração de um guard genérico (decisão: adiada novamente).

**Cardinalidade:** `Content → Publication` é 1:N — um `Content` pode ter várias `Publication`s
(ex.: uma por canal, ou reagendamentos). Sem unicidade sobre `Publication.contentId`. Ver
`ADR-013` seção 1.

---

## Modelagem

```prisma
enum PublicationChannel {
  INSTAGRAM
}

enum PublicationStatus {
  DRAFT
  SCHEDULED
}

model Publication {
  id          String              @id @default(cuid())
  contentId   String
  content     Content             @relation(fields: [contentId], references: [id])
  channel     PublicationChannel
  status      PublicationStatus   @default(DRAFT)
  scheduledAt DateTime?

  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@index([contentId])
  @@map("publications")
}
```

`Content` ganha a relação inversa: `publications Publication[]`.

Sem cascata de estado entre `Content` e `Publication` (arquivar um `Content` não afeta suas
`Publication`s), mesmo critério já adotado entre `Campaign`↔`Content` e `Project`↔`Campaign`.

`PublicationChannel` contém, nesta sprint, exclusivamente `INSTAGRAM` — único canal citado
nominalmente em `VISION.md`. Extensível via nova migration quando outro canal for priorizado
(ver `ADR-013` seção 5 e "Future Evolution").

## Ciclo de vida

- Estado inicial: `DRAFT`. `scheduledAt` pode ser nulo em `DRAFT`.
- `DRAFT → SCHEDULED`: exige `scheduledAt` preenchido; `scheduledAt` não pode estar no passado no
  momento da transição.
- `SCHEDULED → DRAFT`: transição de desagendamento/cancelamento. `scheduledAt` é limpo (`null`)
  ao voltar para `DRAFT`.
- **Não existem, nesta sprint:** `PUBLISHED`, `FAILED`, `RETRYING`, ou qualquer transição para
  eles. Todos dependem de execução real (ver "Limites da sprint" abaixo). Ver `ADR-013` seção 6.
- Sem `DELETE` físico.

## Limites da sprint

Fronteira decidida em `ADR-013` seção 7, por camada:

- **Dentro:** modelo de domínio (`Publication`, `scheduledAt` como dado persistido), lifecycle
  `DRAFT ⇄ SCHEDULED`, ownership derivada, CRUD, API REST, Swagger, testes.
- **Fora — agendamento real:** nenhum worker, fila ou cron. `scheduledAt` não é lido por nenhum
  processo nesta sprint. Não existe, hoje, nenhuma infraestrutura de fila/scheduler no monorepo.
- **Fora — integração externa:** nenhuma chamada a API do Instagram/Meta, nenhum OAuth, nenhuma
  credencial armazenada. Uma `Publication` criada nesta sprint **não publica nada de fato** —
  isso deve estar explícito no Swagger da API, para não sugerir a um consumidor que algo foi
  enviado a uma rede social.
- **Fora — payload/snapshot:** nenhum campo de conteúdo renderizado por canal. A leitura, quando
  a execução real existir, será decidida então (snapshot vs. leitura ao vivo de `Content.body`)
  — decisão explicitamente adiada, não fechada por omissão.
- **Fora — retry/idempotência/histórico:** nenhuma tabela `PublicationAttempt`, nenhum contador
  de tentativas.

## Estrutura de módulo

Segue exatamente o padrão já estabelecido por `ProjectsModule`/`CampaignsModule`/`ContentModule`
(Repository Pattern, Controller fino, regra de negócio no Service):

```
apps/api/src/modules/publication/
├── publication.module.ts                   # Bloco C — não existe antes disso
├── publications.controller.ts              # Bloco C
├── publications.controller.spec.ts         # Bloco C
├── publications.service.ts                 # Bloco B
├── publications.service.spec.ts            # Bloco B
├── repositories/
│   ├── publications.repository.ts          # Bloco A
│   └── publications.repository.spec.ts     # Bloco A
├── guards/
│   ├── publication-ownership.guard.ts      # Bloco B
│   └── publication-ownership.guard.spec.ts # Bloco B
├── dto/                                     # Bloco C
│   ├── create-publication.dto.ts
│   ├── update-publication.dto.ts
│   ├── list-publications-query.dto.ts
│   └── publication-response.dto.ts
```

## Rotas previstas (Bloco C)

```
POST   /v1/campaigns/:campaignId/contents/:contentId/publications
GET    /v1/campaigns/:campaignId/contents/:contentId/publications
GET    /v1/campaigns/:campaignId/contents/:contentId/publications/:id
PATCH  /v1/campaigns/:campaignId/contents/:contentId/publications/:id
```

Todas com `@UseGuards(PublicationOwnershipGuard)` declarado explicitamente — mesmo padrão de
`ContentsController`. `Publication` não recebe `campaignId` nem `contentId` no corpo da
requisição quando esses valores já são determinados pela rota (`contentId` vem do path;
`campaignId` é usado apenas para validação de consistência do path, mesmo critério de
`ContentsController`/`ADR-012`).

Nomenclatura da rota (quatro segmentos aninhados) proposta para manter a mesma filosofia de
autorização/IDOR já estabelecida — a confirmar formalmente com o Arquiteto-Chefe antes do Bloco
C, caso prefira uma forma alternativa.

## Estratégia de autorização

`PublicationOwnershipGuard`, guard específico do módulo (sem abstração compartilhada — ver
`ADR-013` seção 3), cobrindo os dois contextos de rota:

- **Com `:id`:** `Publication` resolvida por `params.id` → validada contra `:contentId` do path →
  `Content` resolvido → validado contra `:campaignId` do path → `Campaign` resolvida →
  `Project` resolvido via `campaign.projectId` → ownership verificada.
- **Sem `:id`** (`create`/`list`): resolução parte diretamente de `:contentId`/`:campaignId`, sem
  o primeiro passo de busca de `Publication`.

Falha em qualquer ponto da cadeia retorna `404 Not Found`, nunca `403` — mesmo contrato de
`ADR-011`/`ADR-012`.

## Estratégia de testes

Mesmo padrão das três sprints anteriores:

- **Bloco A:** testes unitários do `PublicationsRepository`.
- **Bloco B:** testes unitários do `PublicationsService` (transições de lifecycle, incluindo
  rejeição de `scheduledAt` no passado e de `SCHEDULED` sem `scheduledAt`) e do
  `PublicationOwnershipGuard` (cobrindo os dois contextos de rota).
- **Bloco C:** testes E2E completos — fluxo de criação/listagem/atualização, isolamento entre
  usuários, acesso administrativo, IDOR (usuário B não acessa publication de content do usuário
  A; `:contentId`/`:campaignId` de outro recurso do próprio usuário), ancestral inexistente em
  qualquer nível da cadeia (`Content`, `Campaign`, `Project`), validação de transições de
  lifecycle inválidas.

## Divisão em blocos

- **Bloco A — Persistência:** `enum PublicationChannel`, `enum PublicationStatus`,
  `model Publication`, migration, `PublicationsRepository`, testes unitários do repository.
- **Bloco B — Regras de Negócio e Autorização:** `PublicationsService` (transições de lifecycle),
  `PublicationOwnershipGuard` implementando `ADR-013`, testes unitários correspondentes.
- **Bloco C — API REST:** DTOs, `PublicationsController`, `PublicationModule` (registro em
  `AppModule`), Swagger (explícito quanto à ausência de efeito real, ver "Limites da sprint"),
  testes E2E completos.

Sem Bloco D — as camadas de agendamento real e integração externa ficaram explicitamente fora
desta sprint (ver `ADR-013` seção 7), portanto não há responsabilidade arquitetural adicional
que justifique um quarto bloco.

## Fora de escopo (explicitamente, nesta sprint)

- Agendamento real (worker, fila, cron) — `scheduledAt` é apenas dado de domínio
- Integração externa (Meta/Instagram, OAuth, chamada de API) — sprint futura própria, possível
  ADR dedicado
- Estados `PUBLISHED`, `FAILED`, `RETRYING` e qualquer transição para eles
- Payload/snapshot de conteúdo específico por canal — decisão explicitamente adiada, não fechada
- `PublicationAttempt`, retry, idempotência de execução, histórico de tentativas
- Entidade `Channel` própria (contas/credenciais por canal)
- Abstração genérica de `OwnershipGuard` compartilhada entre os quatro agregados — reavaliada
  (quarta vez) e adiada em `ADR-013`

---

## DESIGN FREEZE — SPR-014

As decisões abaixo estão fechadas para esta sprint, sem pendências de domínio em aberto:

| Decisão | Fechamento |
|---|---|
| Cardinalidade Content→Publication | 1:N, sem unicidade em `contentId` |
| Ownership | Derivada, sem `ownerId` próprio, guard específico de módulo |
| Canal | `enum PublicationChannel { INSTAGRAM }` |
| Status | `DRAFT`, `SCHEDULED` apenas |
| Lifecycle | `DRAFT ⇄ SCHEDULED`, sem transição para `PUBLISHED`/`FAILED` |
| Agendamento | `scheduledAt` como dado; nenhuma execução nesta sprint |
| Publicação imediata | Não existe como conceito distinto — toda `Publication` criada é só registro de intenção |
| Payload/snapshot | Fora de escopo; decisão de estratégia explicitamente adiada para quando a execução real for projetada |
| Retry/idempotência/histórico | Fora de escopo |
| Integração externa | Fora de escopo; sprint própria |
| Guard genérico | Adiado pela quarta vez (`ADR-013`) |
| API | `/v1/campaigns/:campaignId/contents/:contentId/publications` |
| Divisão em blocos | A (Persistência) / B (Regras e Autorização) / C (API REST) |

Design Freeze aprovado pelo Arquiteto-Chefe. Bloco A autorizado a iniciar mediante nova
solicitação explícita.
