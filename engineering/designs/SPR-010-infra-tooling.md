# SPR-010 — Governança do Prisma Client + CI (Design Doc)

Status: Accepted

## Objetivo

Fechar `TECH-001` formalizando a política de versionamento de artefatos gerados do Prisma
(`ADR-006`) e implementar um pipeline de Continuous Integration (GitHub Actions) que a aplique
automaticamente — removendo a dependência de validação manual usada em toda a SPR-009 como único
mecanismo de garantia de qualidade antes de merge.

Esta sprint implementa **Continuous Integration**. Continuous Deployment (CD) — publicação
automática em qualquer ambiente — permanece explicitamente fora de escopo; não há artefato no
repositório demonstrando decisão prévia sobre deploy automático, e nada nesta sprint aproxima o
projeto disso.

## Contexto e Problema

SPR-001 a SPR-009 construíram fundação, persistência, autenticação, RBAC, HTTP Pipeline e o
primeiro agregado de domínio (`Project`) — sem nenhuma automação de validação em CI. Toda
validação (lint, testes, build, E2E) foi executada manualmente a cada bloco, inclusive por um
assistente de IA operando em um ambiente sandbox com restrição de rede a `binaries.prisma.sh`,
que precisou de workarounds (Postgres via `apt`, migrations via SQL puro) para conseguir validar
seu próprio trabalho nos três blocos da SPR-009.

Paralelamente, `TECH-001` documentou um risco real e não resolvido: `apps/api/generated/prisma/**`
está versionado sem decisão arquitetural formal, com risco de divergência silenciosa em relação a
`schema.prisma`.

Os dois problemas são tecnicamente acoplados: um pipeline de CI precisa saber a política de
geração do Prisma Client para implementar corretamente seus próprios passos — por isso `ADR-006`
e CI formam uma única sprint coesa, não duas sprints de "infraestrutura genérica" combinadas por
conveniência.

## Estado Atual

- `apps/api/generated/prisma/**` commitado, ~280KB, 100% TypeScript (sem binário, sem timestamp
  embutido — saída determinística confirmada por auditoria).
- `prisma`/`@prisma/client` em `^7.8.0`, resolvidos de forma exata via `pnpm-lock.yaml`.
- `prisma.config.ts` já centraliza `schema`/`migrations`/`datasource.url` fora do
  `schema.prisma` (Prisma 7).
- `pnpm-workspace.yaml` já libera builds de `@prisma/engines`/`prisma` (`allowBuilds`).
- `apps/api/test/.env.test` já commitado com valores não-sensíveis suficientes para rodar E2E em
  qualquer ambiente limpo, sem segredo algum.
- `docker/docker-compose.yml` já define a topologia exata de Postgres (`content_os`/`content_os`,
  porta `5432`) usada pelos testes locais — mesma topologia a ser espelhada no service container
  do GitHub Actions.
- Nenhum arquivo em `.github/` existe hoje.
- `package.json` (raiz) define `engines.node: ">=18"` — permissivo, sem versão exata. **Esta
  sprint não altera esse campo** (ver seção "Decisão sobre Node" abaixo).
- Não existe `.nvmrc` no repositório, e não encontrei nenhuma evidência arquitetural (ADR, design
  doc ou convenção documentada) que exija criá-lo agora.

## Decisão Proposta

Ver `ADR-006` (texto completo). Resumo: `generated/prisma` permanece versionado; CI verifica
sincronização real via `prisma generate` + `git diff --exit-code`, não apenas existência de
arquivo.

## Decisão sobre Node

- O workflow de CI fixa **Node 22** de forma explícita (`actions/setup-node`, `node-version: 22`)
  — decisão de **reprodutibilidade do ambiente de CI**, não uma mudança da política geral de
  engines do projeto.
- `engines.node` em `package.json` **permanece `>=18`, sem alteração nesta sprint** — esse campo
  expressa o requisito mínimo de compatibilidade do projeto como um todo (incluindo ambientes de
  desenvolvedor), não a versão exata usada em um pipeline específico; são decisões de naturezas
  diferentes e não precisam coincidir.
- **Nenhum `.nvmrc` é criado nesta sprint** — não há evidência no repositório (nenhuma ADR,
  nenhum design doc, nenhuma convenção de onboarding) de que o projeto padronize versão de Node
  localmente por esse mecanismo hoje; introduzir um agora seria uma decisão nova, não solicitada
  e fora do escopo desta sprint (infraestrutura de CI, não política geral de ambiente de
  desenvolvimento). Se o Arquiteto-Chefe quiser padronizar isso, é uma decisão a ser tomada
  explicitamente, não uma consequência automática de fixar a versão no workflow.

## Arquitetura do CI

Um único workflow (`.github/workflows/ci.yml`), dois triggers (`pull_request` contra `main`,
`push` em `main`), um único job sequencial — múltiplos jobs paralelos não se justificam no
tamanho atual do projeto (YAGNI).

Ordem das etapas, com a dependência entre elas explicitada:

1. **Checkout** — trivial, sem dependência.
2. **Setup Node** — versão 22, fixada explicitamente no workflow (ver "Decisão sobre Node").
3. **Setup pnpm** — via Corepack, respeitando `packageManager: pnpm@11.11.0` já pinado em
   `package.json`; depende do Node já estar configurado.
4. **Install** — `pnpm install --frozen-lockfile`, com cache do pnpm store por hash de
   `pnpm-lock.yaml`; depende do pnpm configurado.
5. **Verificação de sincronização do Prisma** (`ADR-006`) — depende do install (precisa da CLI do
   Prisma disponível) e **precisa vir antes de qualquer etapa seguinte**, porque lint, build e
   testes importam tipos do client gerado; rodar essa etapa depois deles permitiria que um client
   desatualizado "passasse" silenciosamente por eles antes de a divergência ser detectada.
6. **Lint** — depende da verificação do Prisma ter passado (client correto disponível).
7. **Testes unitários** — não dependem de Postgres (`PrismaService` é mockado em todo teste
   unitário existente); dependem só do client correto.
8. **Build** — depende do client correto; independente de lint/testes ter passado primeiro, mas
   mantido em sequência por simplicidade (não há ganho real em paralelizar neste tamanho de
   projeto).
9. **Postgres** — service container do GitHub Actions, mesma imagem/credenciais de
   `docker/docker-compose.yml` (`postgres:16`, `content_os`/`content_os`, porta `5432`).
10. **Migrations** — `prisma migrate deploy` contra o Postgres do passo anterior.
11. **E2E** — `pnpm --filter api test:e2e`; variáveis de `apps/api/test/.env.test` já commitadas
    cobrem tudo — **nenhum GitHub Secret é necessário** para esta sprint.
12. **Resultado** — qualquer falha em qualquer etapa **faz o job do workflow falhar** (reportado
    como status check vermelho no PR/commit). Isso é diferente de "bloquear o merge" — ver seção
    seguinte.

### GitHub Actions — decisões operacionais

- `concurrency`: cancela execução anterior do mesmo PR/branch ao chegar um commit novo.
- `permissions: contents: read` — mínimo necessário; este pipeline nunca escreve no repositório.
- `timeout-minutes` no job — rede de segurança contra travamento.
- Cache do pnpm store por hash de `pnpm-lock.yaml` — reduz tempo de instalação em execuções
  subsequentes.

### PostgreSQL no CI

Service container `postgres:16`, variáveis idênticas a `docker/docker-compose.yml` — sem
necessidade de nenhuma decisão nova, é reaproveitamento direto de uma convenção já existente.

### Testes

Unitários e E2E ambos executam na CI. Nenhuma alteração nos testes em si — reaproveita 100% do
que já existe (92 testes unitários, 34 E2E) sem modificação.

### Segurança

Nenhum segredo de produção trafega nesta sprint — `.env.test` já commitado é suficiente e não
sensível. `permissions: contents: read` aplica princípio de menor privilégio ao workflow.

### Performance/Custo

Execução única, sequencial, tempo estimado baixo dado o tamanho atual da suíte de testes. Cache
de dependências reduz custo em execuções subsequentes. Nenhuma decisão de custo de infraestrutura
paga é necessária — GitHub Actions inclui minutos gratuitos suficientes para este volume.

## Implementação da SPR-010 vs. Configuração posterior do GitHub

Esta distinção é obrigatória e não deve ser confundida em nenhuma parte deste documento ou do
backlog:

**Implementação da SPR-010 (o que o patch de código entrega):**

- `.github/workflows/ci.yml`.
- Execução automática em Pull Request contra `main`.
- Execução automática em push para `main`.
- Lint, testes unitários, build, verificação do Prisma Client, PostgreSQL real, migrations, E2E.
- O workflow **reporta** falha (status check vermelho) quando qualquer etapa falha.

**Configuração posterior do GitHub (fora do que qualquer patch consegue expressar — ação manual
no GitHub, feita pelo Arquiteto-Chefe, fora do escopo de código desta sprint):**

- Proteger a branch `main`.
- Exigir que o status check da CI esteja verde antes de permitir merge.
- Eventualmente exigir Pull Request (impedir push direto).
- Demais regras de proteção (ex.: exigir revisão de código).

**O workflow, por si só, não bloqueia merge nenhum** — ele só produz um sinal (verde/vermelho).
Quem transforma esse sinal em bloqueio efetivo é a configuração de branch protection do
repositório no GitHub, que é uma decisão operacional externa ao código, e não está incluída nos
critérios de aceite que o patch desta sprint consegue cumprir sozinho.

## Riscos

- Ausência de pin de versão de Node no `engines.node`/`.nvmrc` é um risco de reprodutibilidade
  pré-existente do projeto como um todo, não introduzido por esta sprint, e deliberadamente não
  resolvido aqui — mitigado, apenas para o CI, pela fixação de Node 22 no workflow.
- `prisma migrate deploy`/`prisma generate` em CI dependem de rede externa
  (`binaries.prisma.sh`) — sem risco elevado, já que runners do GitHub Actions não têm a mesma
  restrição enfrentada no ambiente de desenvolvimento assistido por IA usado neste projeto.
- Sem branch protection configurada, a CI existe mas não impede merge — risco operacional, não
  de código; registrado explicitamente como ação pendente fora do escopo do patch.

## Alternativas Consideradas

Ver `ADR-006` para as alternativas de política de versionamento rejeitadas (remover
`generated/` do Git; manter status quo sem verificação; verificar só existência de arquivo).
Para a arquitetura de CI em si: múltiplos jobs paralelos (rejeitada — complexidade sem benefício
no tamanho atual do projeto); dois workflows separados por trigger (rejeitada — duplicaria a
definição do job sem necessidade); criar `.nvmrc` junto desta sprint (rejeitada — sem evidência
arquitetural que a exija agora; decisão separada, se e quando o Arquiteto-Chefe quiser).

## Fora de Escopo

`Campaign`; registro público de usuários; qualquer trabalho de frontend; **CD/deploy
automático**; OAuth; recuperação de senha; 2FA; geração por IA; qualquer funcionalidade de
produto; qualquer alteração no domínio `Project`; qualquer refatoração não relacionada à
infraestrutura desta sprint; alteração de `engines.node`; criação de `.nvmrc`; configuração de
branch protection (é ação operacional do Arquiteto-Chefe, não implementação de código).

## Divisão em Blocos

**Bloco A — Governança e Preparação**

- `ADR-006` criada e aprovada.
- Ajustes de configuração/documentação decorrentes da decisão (ex.: instruções de `README.md`
  sobre o fluxo "alterar schema → gerar → commitar os dois juntos").
- `TECH-001` formalmente fechada, referenciando `ADR-006`.
- **Sem pipeline de CI ainda** — este bloco é só decisão e preparação.

**Bloco B — CI**

- `.github/workflows/ci.yml` implementado, executando exatamente a política decidida no Bloco A.
- **Depende do Bloco A estar aprovado e mergeado** — não pode começar antes, porque
  implementaria uma política ainda não decidida formalmente.

## Critérios de Aceite

**Governança:**

- `ADR-006` com `Status: Accepted` ao final da sprint (segue o fluxo `Proposed → Design Review →
  Design Freeze → Implementação → Validação → Accepted`, mesma convenção já usada nas ADRs
  anteriores).
- `TECH-001` marcada resolvida, referenciando `ADR-006`.
- `README.md` reflete o fluxo "alterar schema → gerar → commitar os dois juntos".
- `PROJECT_STATUS.md` reflete que **CI** foi implementado, sem declarar CD/deploy como
  implementado — usando o indicador agregado `CI/CD` já existente no documento (não há indicador
  separado só de "CI" nele hoje; não é criado um novo), de forma que a redação não implique CD
  concluído. `Deploy`, indicador já existente e separado, permanece `⬜ Planejado`, inalterado.

**Prisma:**

- `generated/prisma` permanece versionado.
- Existe verificação automatizada de sincronização real de conteúdo (não apenas existência).
- Divergência entre `schema.prisma` e `generated/prisma` faz a etapa correspondente do workflow
  falhar, comprovado por um teste prático (alterar o schema sem regenerar, confirmar que a etapa
  falha; regenerar, confirmar que passa).

**CI (o que o código desta sprint garante sozinho):**

- Workflow dispara em Pull Request contra `main`.
- Workflow dispara em push para `main`.
- Lint executa.
- Testes unitários executam.
- Build executa.
- PostgreSQL real é usado no E2E (não mock).
- Migrations aplicadas antes do E2E.
- E2E executa.
- Qualquer falha em qualquer etapa faz o **workflow** (não o merge) falhar/reportar vermelho.

**Arquitetura:**

- Nenhum código de domínio alterado.
- Nenhum endpoint novo.
- Nenhuma funcionalidade de produto.
- Nenhuma alteração em `Project`.
- Nenhum CD/deploy implementado.

**Explicitamente fora do que os critérios de aceite desta sprint cobrem** (não é algo que o
patch consiga garantir sozinho): bloqueio efetivo de merge em caso de falha — depende de branch
protection, configuração manual do Arquiteto-Chefe no GitHub, após a sprint.

## Estratégia de Rollback

Este pipeline não realiza deploy — não há estado de produção para reverter. Se o workflow em si
tiver um defeito que produza falsos positivos/negativos, a correção é um PR normal ao próprio
arquivo do workflow, sujeito à mesma revisão que qualquer outra mudança. Não há necessidade de
mecanismo de rollback além do fluxo de Pull Request já existente.

## Impacto na Documentação

`README.md` (fluxo de setup: "após alterar `schema.prisma`, rode `pnpm db:generate` e commite o
diff junto"); `PROJECT_STATUS.md` (indicador agregado `CI/CD` atualizado para refletir que CI foi
implementado, sem implicar CD — indicador `Deploy`, separado, permanece `⬜ Planejado`).

## Impacto no Desenvolvimento Local

Nenhum novo passo manual é exigido além do que já existe hoje (`pnpm db:generate` já documentado
no `README.md`) — a CI passa a **verificar** a disciplina existente, não a criar uma nova.
`engines.node` e ausência de `.nvmrc` permanecem exatamente como estão — nenhum impacto no
ambiente de desenvolvimento local desta sprint.

## Plano de Implementação

Bloco A primeiro (governança, sem código de pipeline) → aprovação e merge → Bloco B (pipeline,
implementando exatamente a política já decidida e mergeada no Bloco A).

## Plano de Validação

Bloco A: nenhuma validação técnica automatizada além de revisão documental (é puramente
governança). Bloco B: o próprio pipeline validado contra um cenário positivo (tudo sincronizado,
pipeline verde) e um cenário negativo controlado (schema alterado sem regenerar, pipeline
vermelho) antes de ser considerado pronto para revisão. Branch protection, se e quando
configurada, é validada separadamente pelo Arquiteto-Chefe (fora do escopo de validação do
patch).
