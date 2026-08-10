# TECH-001 — Revisar estratégia de versionamento do Prisma Client gerado

## Status

Em andamento — decisão arquitetural formalizada em `ADR-006-generated-artifacts-versioning-
policy.md` (`Status: Proposed`); resolução definitiva pendente da aprovação da ADR e da
implementação do Bloco B (CI) da SPR-010

## Origem

Identificado durante o "Repository Health Check" pré-SPR-008 e reconfirmado durante a
verificação técnica do Bloco A (RBAC): `apps/api/generated/prisma/**` está versionado no git,
mas o `.gitignore` do projeto não possui nenhuma regra para excluí-lo — não há evidência de que
essa seja uma decisão arquitetural deliberada.

## Descrição

- O Prisma está configurado para gerar o client em `apps/api/generated/prisma`.
- Esses arquivos estão commitados no repositório.
- O próprio `README.md` instrui gerar o client localmente (`pnpm --filter api exec prisma
  generate`) como parte do setup — o que sugere que o versionamento do artefato gerado não era
  intencional.
- Risco concreto observado: o client gerado embute, além dos tipos TypeScript, um
  `runtimeDataModel` e um plano de query pré-compilado usados pela engine em tempo de execução.
  Uma alteração no `schema.prisma` sem regenerar e recommitar o client corretamente pode deixar
  o repositório num estado onde `schema.prisma` e `generated/` divergem silenciosamente — sem
  nenhum erro de lint, type-check ou build acusando isso, até o comportamento em runtime falhar.

## Decisão desta sprint (SPR-008)

Por decisão do Arquiteto-Chefe, esta dívida **não é tratada na SPR-008** — alterar a política de
versionamento de artefatos gerados é uma mudança de governança de repositório, não uma
implementação de RBAC/HTTP Pipeline, e extrapola o escopo desta sprint.

Portanto, nesta entrega: `.gitignore` não foi alterado, `apps/api/generated/` permanece
versionado, e nenhuma migração de estratégia foi feita.

## Encaminhamento

- Este item deve ser resolvido em uma sprint própria de infraestrutura (ver
  `engineering/backlog/infra-backlog.md`).
- Essa sprint deverá produzir a `ADR-006 — Generated Artifacts Versioning Policy`, definindo:
  - quais artefatos gerados fazem parte do repositório (se algum);
  - quais nunca devem ser versionados;
  - política específica para o Prisma Client;
  - responsabilidades do CI/CD (quem gera o client e quando: build local, pipeline, ou ambos);
  - processo de onboarding para novos desenvolvedores (o que rodar após o clone).

## Impacto de não resolver agora

Baixo a médio no curto prazo (nenhum incidente registrado); risco cresce a cada sprint que altera
`schema.prisma` sem que a disciplina de regenerar/recommitar o client seja seguida à risca.

## Resolução em Andamento (SPR-010, Bloco A)

A decisão arquitetural foi formalizada em `ADR-006-generated-artifacts-versioning-policy.md`:
`apps/api/generated/prisma/**` permanece versionado; a sincronização real de conteúdo com
`schema.prisma` passará a ser verificada automaticamente via `prisma generate` +
`git diff --exit-code`, substituindo a disciplina manual como mecanismo de garantia. As
responsabilidades de desenvolvedor e de CI estão detalhadas na ADR.

Esta dívida **ainda não está resolvida**. Faltam, nesta ordem:

1. Aprovação formal da `ADR-006` (hoje `Status: Proposed`, segue o fluxo `Proposed → Design
   Review → Design Freeze → Implementação → Validação → Accepted`, mesma convenção já usada nas
   demais ADRs do repositório).
2. Implementação do Bloco B da SPR-010 — o workflow de CI que efetivamente executa a verificação
   de sincronização descrita na ADR. Até o Bloco B existir, a verificação automatizada não roda em
   lugar nenhum; a disciplina de regenerar/recommitar continua manual, exatamente como antes.

`TECH-001` só deve ser marcada `Resolvido` quando ambos os itens acima estiverem concluídos e
mergeados em `main`.
