# ADR-008 — Estratégia do Agregado `Project`

## Status

Proposed

## Context

A SPR-009 inaugura a camada de domínio do Content-OS (SPR-001 a SPR-008 construíram fundação,
persistência, autenticação, RBAC e HTTP Pipeline — nenhuma entidade de negócio existia até aqui).

Por `VISION.md` (Roadmap Estratégico, Release 0.6) e pela seção "Pilares do Produto —
Organização" (*"Projetos organizam campanhas. Campanhas organizam conteúdos. Conteúdos organizam
publicações."*), `Project` é a entidade raiz de todo o domínio — tudo o mais (Campanha, Conteúdo,
Publicação) será modelado em sprints futuras, como filhos de um Projeto.

Modelar o agregado raiz corretamente agora evita retrabalho estrutural quando Campanha/Conteúdo
forem introduzidos — mas, seguindo o mesmo critério de YAGNI já aplicado na `ADR-004`, esta ADR
modela **apenas** `Project`, sem antecipar os agregados filhos.

## Decision

- **Agregado:** `Project` é seu próprio agregado raiz nesta sprint — sem entidades filhas
  (Campanha/Conteúdo ficam para sprints futuras, quando existir consumidor real).
- **Propriedade:** um projeto pertence a exatamente um usuário (`ownerId`, FK para `User`).
  **Não** há colaboração/compartilhamento multi-usuário nesta sprint — sem tabela de
  membros/colaboradores. Cada usuário só enxerga e gerencia os próprios projetos (RBAC de
  `ADMIN`/`SUPER_ADMIN` dá acesso administrativo a qualquer projeto — ver `ADR-009`).
- **Campos:** `id` (`cuid()`), `name` (obrigatório, até 120 caracteres), `description`
  (opcional, até 2000 caracteres), `status` (`enum ProjectStatus`), `ownerId`, `createdAt`,
  `updatedAt`.
- **Ciclo de vida via `status`, não via linha física:** `enum ProjectStatus { ACTIVE, ARCHIVED }`,
  `@default(ACTIVE)`. "Excluir" um projeto significa arquivá-lo (`ACTIVE` → `ARCHIVED`), nunca um
  `DELETE` físico no banco.
  - **Motivo:** (1) recuperabilidade — o usuário pode se arrepender; (2) quando Campanha/Conteúdo
    existirem como filhos de `Project`, um `DELETE` físico exigiria decidir cascade vs. bloqueio
    a cada sprint futura; arquivar evita esse problema estrutural desde já; (3) é o padrão já
    visto em produtos de organização de conteúdo (arquivar, não apagar).
  - Ações de ciclo de vida são endpoints dedicados (`archive`/`restore`), não um campo `status`
    aberto a escrita livre via `PATCH` genérico — evita que um `PATCH` acidental mude o estado de
    forma não intencional (ver `ADR-010` para o contrato REST completo).
- **Transferência de propriedade:** fora de escopo nesta sprint (YAGNI — sem caso de uso
  registrado). `ownerId` é imutável após a criação.

## Consequences

- `schema.prisma` ganha `model Project` e `enum ProjectStatus`; `User` ganha a relação inversa
  `projects Project[]`.
- Nenhuma entidade filha existe ainda — `Project` é uma "folha" no grafo de domínio por enquanto.
  Quando Campanha for modelada, esta ADR **não muda**; uma nova ADR tratará o relacionamento
  `Project` → `Campanha`.
- Um `DELETE /v1/projects/:id` HTTP **não existe** — a exclusão física fica fora de escopo do
  produto, não só desta sprint (nenhum gatilho de negócio a justifica hoje).
- Migração de dados nunca é necessária para "desarquivar" — é reversível por design.

## Alternativas consideradas

- **Hard delete com soft-delete via `deletedAt`:** rejeitado — `deletedAt` sinaliza "removido",
  enquanto `ARCHIVED` é um estado de negócio visível e reversível pelo próprio usuário (não é uma
  purga). São conceitos diferentes; usar `deletedAt` para essa semântica esconderia a intenção de
  negócio atrás de um campo técnico.
- **Colaboração multi-usuário desde já:** rejeitado por YAGNI — nenhum requisito de produto
  registrado a justifica nesta sprint; adicionar depois é aditivo (nova tabela de membros), não
  destrutivo.
