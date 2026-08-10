# ADR-006 — Generated Artifacts Versioning Policy

## Status

Proposed

## Context

`apps/api/generated/prisma/**` está versionado no repositório desde as primeiras sprints, mas
sem que o `.gitignore` jamais tenha excluído esse diretório deliberadamente — não há evidência de
que essa seja uma decisão arquitetural tomada conscientemente. `TECH-001` identificou isso
formalmente durante o Repository Health Check pré-SPR-008 e o reconfirmou na verificação técnica
do Bloco A (RBAC).

O client gerado embute, além dos tipos TypeScript, um `runtimeDataModel` e um plano de query
usados pela engine em tempo de execução. Uma alteração em `schema.prisma` sem regenerar e
recommitar o client corretamente deixa o repositório num estado onde `schema.prisma` e
`generated/` divergem **silenciosamente** — sem nenhum erro de lint, type-check ou build
acusando isso, até o comportamento em runtime falhar.

Esse risco não é hipotético: foi enfrentado de forma concreta durante toda a SPR-009, onde a
geração do Prisma Client ficou bloqueada em ambientes com acesso de rede restrito a
`binaries.prisma.sh` (incluindo o ambiente usado pelo assistente de IA que atua como parceiro de
implementação técnica neste projeto), exigindo validação manual como único mecanismo de garantia.

Por se tratar de uma decisão de governança de repositório que afeta todo PR que altera
`schema.prisma`, e que é cara de reverter depois que o processo de desenvolvimento já se
acostumou a uma disciplina (manual ou automatizada) específica, esta decisão é formalizada como
ADR.

## Problem

Duas fontes de verdade — `schema.prisma` (o que deveria ser) e `apps/api/generated/prisma/**`
(o que o runtime realmente usa) — podem divergir sem qualquer sinal automático até uma falha em
produção. Nenhum mecanismo hoje impede isso.

## Decision

`apps/api/generated/prisma/**` **continua versionado no Git**.

O CI passa a ser o guardião automático da sincronização entre `schema.prisma` e
`generated/prisma/**` — nenhuma disciplina manual é mais o único mecanismo de garantia.

Motivação de manter versionado (em vez de remover e gerar sempre): mantém o repositório
previsível para desenvolvimento, revisão de patches e ambientes onde `prisma generate` possa
sofrer restrições externas de rede — cenário já vivido concretamente nesta SPR-009, não
hipotético.

## Mecanismo de Verificação

O CI executa, nesta ordem, após a instalação de dependências e antes de qualquer etapa que
importe tipos do client gerado (lint, build, testes):

1. `pnpm --filter api exec prisma generate` — regenera `apps/api/generated/prisma/**` de verdade,
   sobrescrevendo o conteúdo já commitado, usando a versão do Prisma resolvida por
   `pnpm-lock.yaml` (determinística — não depende de cache local nem de versão de CLI variável).
2. `git diff --exit-code -- apps/api/generated/prisma` — se houver qualquer diferença entre o que
   acabou de ser gerado e o que estava commitado, o comando retorna código de saída não-zero e o
   pipeline falha.

Este mecanismo verifica sincronização **real de conteúdo**, não apenas presença de arquivo —
qualquer alteração em `schema.prisma` sem a regeneração/recommit correspondente é detectada.

Confirmado por auditoria: o client gerado por este projeto não contém timestamp nem qualquer
elemento não-determinístico — duas gerações a partir do mesmo `schema.prisma`, com a mesma
versão do Prisma, produzem bytes idênticos. Isso elimina o risco de falso positivo por ruído de
geração.

## Responsibilities

**Desenvolvedor** (fluxo local, ao alterar `schema.prisma`):

- Alterar `schema.prisma`.
- Rodar `pnpm db:generate` (`prisma generate`) localmente.
- Validar que a alteração funciona como esperado.
- Commitar `schema.prisma` **e** o diff resultante em `apps/api/generated/prisma/**` no mesmo
  Pull Request — nunca separadamente.

**CI:**

- Verificar a sincronização via o mecanismo descrito acima, em todo Pull Request contra `main` e
  em todo push para `main`.
- Reportar falha visível quando houver divergência — o bloqueio efetivo de merge é uma
  configuração de branch protection do GitHub, não algo que a execução do workflow garanta
  sozinha (ver Design Doc da SPR-010, seção "Configuração posterior do GitHub").

## Consequences

**Positivas:**

- O risco central identificado por `TECH-001` (divergência silenciosa) passa a ser detectado
  automaticamente, não depende mais de disciplina manual.
- O repositório permanece previsível: qualquer ambiente que faça `git clone` tem um client
  Prisma funcional imediatamente, sem depender de acesso de rede a `binaries.prisma.sh` no
  primeiro uso — relevante para qualquer ambiente com restrição de rede (confirmado já ocorrer
  neste projeto).
- Revisão de PR continua podendo inspecionar o diff do client gerado, como já acontecia.

**Negativas:**

- Todo PR que altera `schema.prisma` sem regenerar o client corretamente faz o CI reportar falha
  — atrito adicional no fluxo de desenvolvimento, mitigado por ser um passo de comando único
  (`pnpm db:generate`) já documentado no `README.md`.
- O repositório continua acumulando o "peso" do client gerado no histórico do git (atualmente
  ~280KB, majoritariamente TypeScript — não é um custo de armazenamento relevante hoje).

## Alternatives Rejected

- **Remover `generated/prisma` do Git, gerar sempre (local e CI):** mais "limpo" do ponto de
  vista de higiene de repositório para artefatos gerados, mas quebra a premissa de que o
  repositório funciona imediatamente após `git clone` em qualquer ambiente — incluindo ambientes
  com restrição de rede já enfrentada de fato nesta sprint anterior. Rejeitada por esse motivo
  concreto, não por preferência estética.
- **Manter o status quo, sem nenhuma verificação:** não resolve o problema que `TECH-001`
  identificou — apenas o documenta sem mitigá-lo. Rejeitada.
- **Verificação apenas por existência de arquivo (sem diff de conteúdo):** não detecta o risco
  real (divergência de conteúdo entre schema e client). Rejeitada explicitamente por instrução do
  Arquiteto-Chefe.
