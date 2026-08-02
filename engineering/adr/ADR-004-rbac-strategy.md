# ADR-004 — Estratégia de Autorização (RBAC)

## Status

Accepted

## Context

A SPR-007 entregou autenticação (ADR-002) com um guard global que garante que toda rota exige
um usuário autenticado, salvo marcação explícita com `@Public()`. Isso resolve "quem é o
usuário", mas não "o que este usuário pode fazer" — não existe hoje nenhuma diferenciação de
papel entre usuários.

A SPR-008 precisa da fundação mínima de autorização para permitir que rotas futuras (gestão de
usuários, projetos, conteúdo) restrinjam acesso por papel, sem reabrir a ADR-002.

Seguindo o mesmo critério usado nas ADRs anteriores (`ENGINEERING_GUIDE.md`: "estabelece um
padrão que vale para todo o projeto" + "é cara de reverter" — trocar o modelo de autorização
depois que rotas de negócio já dependerem dele exigiria reescrever guards e, possivelmente,
migrar dados), esta decisão é formalizada como ADR.

## Decision

- **Modelo:** um único papel por usuário (**single-role-per-JWT**), não múltiplos papéis.
- **Implementação:** `enum Role` nativo do Prisma (`SUPER_ADMIN`, `ADMIN`, `USER`), coluna
  `role` em `User`, com `@default(USER)`.
- **Não** será criada tabela `Role`, `Permission` ou `UserRole` nesta sprint.
- **Não** haverá Claims de autorização granulares, Policy Engine ou ACL nesta sprint.
- **JWT payload** passa a incluir `role`, além de `sub` e `email` já existentes (ADR-002 já
  previa esse espaço de extensão sem necessidade de revisão).
- **Aplicação:** `RolesGuard` (local, aplicado via `@UseGuards(RolesGuard)`) lido em conjunto
  com um decorator `@Roles(...roles: Role[])`, executado **depois** do `JwtAuthGuard` global —
  ou seja, autorização pressupõe autenticação já resolvida.
- Rotas sem `@Roles()` continuam exigindo apenas autenticação (comportamento herdado da
  ADR-002), não autorização adicional.

## Consequences

- Qualquer rota de negócio futura pode restringir acesso com `@Roles(Role.ADMIN)` sem
  nenhuma alteração estrutural adicional.
- Usuários existentes (e novos, por padrão) recebem `USER` automaticamente — sem quebra de
  compatibilidade com o que a SPR-007 já entregou.
- Autorização granular (por recurso/ação) não é possível com este modelo — é uma limitação
  aceita conscientemente nesta sprint (ver "Future Evolution").
- Alterar o modelo de papel único para múltiplos papéis, ou introduzir Permissions/Claims,
  exige uma nova ADR que substitua esta (e uma migration de dados para usuários já existentes).

## Future Evolution

- **Por que enum `Role` e não tabelas `Role`/`Permission`:** hoje não existe nenhum consumidor
  real que precise de papéis dinâmicos ou permissões configuráveis em runtime — os únicos
  papéis conhecidos são os três listados. Um enum nativo do Prisma é validado em nível de banco,
  não exige joins adicionais em cada request autenticado, e é suficiente para o escopo atual.
  Criar uma modelagem normalizada (`Role`/`Permission`/`UserRole`) sem um caso de uso real violaria
  o princípio de YAGNI já aplicado em outras decisões do projeto (ex.: `configuration.ts`).
- **Por que não existem Permissions:** Permissions fazem sentido quando diferentes papéis
  precisam de combinações finas e configuráveis de ações — cenário que não existe hoje, já que
  o produto ainda não tem módulos de negócio (projetos, conteúdo) para os quais essa
  granularidade importaria.
- **Por que não existem Claims:** Claims genéricas adicionariam um nível de indireção (verificar
  uma claim arbitrária em vez de um papel fixo) sem nenhum caso de uso presente que precise
  disso — não há hoje necessidade de autorização condicional além de "papel X pode, papel Y
  não pode".
- **Quando evoluir:** esta decisão deve ser revisitada (nova ADR) quando **qualquer** um destes
  gatilhos ocorrer:
  1. Um mesmo usuário precisar de mais de um papel simultaneamente;
  2. Um papel precisar de um subconjunto configurável de permissões em vez de tudo-ou-nada;
  3. For necessário atribuir/revogar acesso a recursos individuais (não apenas a rotas inteiras);
  4. Multi-tenancy exigir papéis com escopo por tenant (ver `ADR-002`, seção de extensibilidade,
     e a nota de Multi-tenancy registrada na SPR-008).
