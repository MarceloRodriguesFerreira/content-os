# Backlog de Infraestrutura

Itens que afetam governança do repositório, CI/CD ou processo — não são funcionalidades de
produto e não competem por espaço com as sprints numeradas, mas precisam de uma sprint própria
de infraestrutura para serem tratados com o mesmo rigor (Design Freeze, ADR quando aplicável).

## Pendentes

### Estratégia de versionamento de artefatos gerados

- **Origem:** `TECH-001` (`engineering/tech-debt/TECH-001-prisma-client-versioning.md`)
- **Decisão registrada em:** SPR-008 (Bloco A) — explicitamente adiado pelo Arquiteto-Chefe para
  fora desta sprint.
- **Entregável esperado:** `ADR-006 — Generated Artifacts Versioning Policy`
- **Deve definir:** artefatos gerados versionados vs. não versionados, política específica do
  Prisma Client, responsabilidade do CI/CD, processo de onboarding.
