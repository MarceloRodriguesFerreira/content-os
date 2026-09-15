# SPR-013 — Domínio: Content (Design Doc)

Status: Accepted

## Objetivo

Modelar `Content` como primeiro agregado filho de `Campaign`, evoluindo o domínio de negócio do
Content-OS iniciado na SPR-009 (`Project`) e continuado na SPR-012 (`Campaign`). `Content` não
possui `ownerId` próprio — a posse é derivada exclusivamente pela cadeia
`Content.campaignId → Campaign.projectId → Project.ownerId`.

Decisões de arquitetura: `ADR-012-content-ownership-authorization.md`.

Segue o mesmo padrão de execução incremental por blocos adotado nas SPR-008, SPR-009 e SPR-012:
cada bloco termina com lint, testes, build, relatório técnico, e aguarda aprovação antes do
próximo.

**Mesma diferença estrutural já registrada na SPR-012 em relação à SPR-009:** `ContentsController`
só passa a existir no Bloco C — não há superfície HTTP para exercitar via E2E antes disso. Testes
E2E completos ficam concentrados no Bloco C; Blocos A e B são cobertos por testes unitários
(Repository, Service, Guard isolados).

**Diferença em relação à SPR-012:** `Content` é um recurso de terceiro nível (neto de `Project`,
filho de `Campaign`, sem `ownerId` próprio), o que exige que a autorização atravesse dois
recursos ancestrais em vez de um, e valide consistência entre `:campaignId` e `:id` na rota —
mesmo problema de `Campaign` em relação a `Project`, um nível mais profundo. A rota de `Content`
não expõe `:projectId` no path (diferente da rota de `Campaign`, que expõe `:projectId`) — o
`projectId` usado para resolver o `Project` é sempre obtido de `campaign.projectId`, nunca de um
parâmetro de URL. Ver `ADR-012` para a análise completa e a decisão de manter
`ContentOwnershipGuard` como guard específico do módulo (YAGNI, sem abstração compartilhada com
`ProjectOwnershipGuard`/`CampaignOwnershipGuard`).

---

## Modelagem

```prisma
enum ContentStatus {
  ACTIVE
  ARCHIVED
}

model Content {
  id         String        @id @default(cuid())
  name       String
  body       String?
  status     ContentStatus @default(ACTIVE)
  campaignId String
  campaign   Campaign      @relation(fields: [campaignId], references: [id])

  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  @@index([campaignId])
  @@map("contents")
}
```

`Campaign` ganha a relação inversa: `contents Content[]`.

Sem `@@unique([campaignId, name])` — nomes de conteúdo não são únicos por campanha, mesmo
critério já adotado para `Campaign` em relação a `Project`. Sem cascata de estado entre
`Campaign` e `Content` (arquivar/restaurar uma `Campaign` não afeta seus `Content`s, mesmo
critério da SPR-012).

## Ciclo de vida

- Estado inicial: `ACTIVE`.
- `ARCHIVED` é terminal nesta sprint — sem `restore`.
- Sem `DELETE` físico.
- Nenhum estado adicional além de `ACTIVE`/`ARCHIVED` é criado nesta sprint.

## Estrutura de módulo

Segue exatamente o padrão já estabelecido por `ProjectsModule`/`CampaignsModule` (Repository
Pattern, Controller fino, regra de negócio no Service):

```
apps/api/src/modules/content/
├── content.module.ts              # Bloco C — não existe antes disso
├── contents.controller.ts         # Bloco C
├── contents.controller.spec.ts    # Bloco C
├── contents.service.ts            # Bloco B
├── contents.service.spec.ts       # Bloco B
├── repositories/
│   ├── contents.repository.ts     # Bloco A
│   └── contents.repository.spec.ts # Bloco A
├── guards/
│   ├── content-ownership.guard.ts      # Bloco B
│   └── content-ownership.guard.spec.ts # Bloco B
├── dto/                            # Bloco C
│   ├── create-content.dto.ts
│   ├── update-content.dto.ts
│   ├── list-contents-query.dto.ts
│   └── content-response.dto.ts
```

## Rotas previstas (Bloco C)

```
POST   /v1/campaigns/:campaignId/contents
GET    /v1/campaigns/:campaignId/contents
GET    /v1/campaigns/:campaignId/contents/:id
PATCH  /v1/campaigns/:campaignId/contents/:id
POST   /v1/campaigns/:campaignId/contents/:id/archive
```

Todas com `@UseGuards(ContentOwnershipGuard)` declarado explicitamente — mesmo padrão de
`CampaignsController`.

## Divisão em blocos

- **Bloco A — Persistência:** `enum ContentStatus`, `model Content`, migration,
  `ContentsRepository`, testes unitários do repository.
- **Bloco B — Regras de Negócio e Autorização:** `ContentsService`, `ADR-012`,
  `ContentOwnershipGuard`, testes unitários correspondentes.
- **Bloco C — API REST:** DTOs, `ContentsController`, `ContentsModule` (registro em `AppModule`),
  Swagger, testes E2E completos.

## Fora de escopo (explicitamente, nesta sprint)

- `Publicação` (entidade filha de `Content` — sprint futura)
- Restauração de conteúdo arquivado (`restore`)
- `DELETE` físico de conteúdo
- `@@unique([campaignId, name])`
- Cascata de estado entre `Campaign` e `Content`
- Abstração genérica de `OwnershipGuard` compartilhada entre `Project`, `Campaign` e `Content` —
  reavaliada e adiada na `ADR-012`
- Ordenação customizável na listagem (fixo: `createdAt desc`, mesmo padrão de `Project`/`Campaign`)
