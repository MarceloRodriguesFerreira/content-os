# Sprint Closure

## Objetivo

Procedimento operacional repetível para encerrar formalmente uma sprint do Content-OS — usado
tanto por humanos quanto por assistentes de IA. Este documento ensina **como fazer** a auditoria
e o fechamento de uma sprint; não é sobre **por que decidimos fazer assim** (isso é ADR) nem
sobre **o que vamos construir** (isso é Design Doc) — é sobre a sequência de passos para
confirmar que uma sprint tecnicamente concluída pode, de fato, ser dada como formalmente
encerrada.

Consolida os aprendizados operacionais da SPR-009 — a primeira sprint do Content-OS a passar por
um encerramento formal auditado.

---

# Pré-requisitos

- Todos os blocos previstos da sprint foram implementados.
- Todos os blocos foram aprovados individualmente pelo Arquiteto-Chefe.
- O último bloco já foi mergeado em `main` (Pull Request aprovado e fechado).

---

# 1. Auditoria Inicial do Git — Não Alterar Nada

Rodar, nesta ordem, sem modificar nenhum arquivo:

```bash
git status
git branch -vv
git branch -r
git fetch --prune
git log --graph --oneline --decorate -10
git stash list
```

Confirmar:

- [ ] Branch atual é `main`
- [ ] `main` está sincronizada com `origin/main` (sem commits locais pendentes)
- [ ] Working tree limpo (`git status` sem alterações)
- [ ] `git stash list` vazio
- [ ] Sem branches remotas órfãs relacionadas à sprint (`git branch -r` só deve mostrar
  `origin/main`/`origin/HEAD` — branches de validação de bloco já devem ter sido removidas no
  merge de cada PR)

Se qualquer item falhar, **parar aqui** e reportar ao Arquiteto-Chefe antes de prosseguir.

---

# 2. Validação Técnica da Sprint

Para cada bloco previsto no backlog da sprint (`engineering/backlog/SPR-XXX.md`), confirmar:

- [ ] Design Freeze aprovado e mergeado
- [ ] Bloco A aprovado e mergeado
- [ ] Bloco B aprovado e mergeado
- [ ] Bloco C aprovado e mergeado (ou blocos adicionais, conforme o backlog específico da
  sprint)
- [ ] Critérios de aceite do backlog atendidos — todas as caixas `- [ ]`/`- [x]` do backlog
  refletem a realidade; nenhuma tarefa concluída segue marcada como pendente, e vice-versa

Reexecutar, no estado final de `main`:

```bash
pnpm --filter api lint
pnpm --filter api test        # unitários
pnpm --filter api build
pnpm --filter api test:e2e    # quando a sprint expõe superfície HTTP
```

- [ ] Lint limpo
- [ ] Testes unitários verdes
- [ ] Build limpo
- [ ] Testes E2E verdes (quando aplicável)
- [ ] Migrations aplicadas e consistentes com `schema.prisma`
- [ ] Regras de segurança/autorização específicas da sprint validadas por teste automatizado
  (ex.: isolamento por dono de recurso, acesso administrativo) — não apenas por leitura de
  código
- [ ] Nenhuma alteração funcional pendente de bloco ainda não aprovado

> **Aprendizado da SPR-009:** nem todo bloco de uma sprint tem superfície HTTP disponível para
> testar via E2E — quando um bloco não expõe endpoint (ex.: Repository/Service/Guard antes de o
> Controller existir), cobertura por teste unitário isolado é suficiente e correta para aquele
> bloco. Não é redução de rigor, é a granularidade de teste certa para cada camada. Testes E2E
> completos ficam concentrados no bloco que introduz o Controller.

---

# 3. Governança das ADRs e Design Docs

```bash
grep -A2 "^## Status" engineering/adr/ADR-*.md
```

- [ ] Auditar todas as ADRs relacionadas à sprint
- [ ] Identificar quais ainda estão `Proposed`
- [ ] **Antes de promover:** determinar a convenção real do projeto auditando ADRs já
  implementadas e mergeadas em sprints anteriores — não assumir um novo estado de governança por
  conta própria
- [ ] Promover para `Accepted` **somente** quando a convenção existente suportar objetivamente
  essa promoção
- [ ] Se houver dúvida ou inconsistência entre documentos sobre o procedimento correto, **não
  decidir silenciosamente** — reportar ao Arquiteto-Chefe
- [ ] Atualizar o Status do Design Doc da sprint, seguindo a mesma convenção aplicada às ADRs
- [ ] Atualizar o backlog da sprint (`engineering/backlog/SPR-XXX.md`): marcar os blocos
  concluídos seguindo a mesma convenção já usada em sprints anteriores (ex.: `✅ Concluído
  (aprovado pelo Arquiteto-Chefe)`, checkboxes `[x]`)

> **Aprendizado da SPR-009:** a convenção correta se determina por amostragem real do
> repositório (status de todas as ADRs existentes), não por suposição. Na SPR-009, 6 de 6 ADRs
> previamente implementadas usavam `Accepted` sem exceção — isso tornou a promoção uma aplicação
> objetiva de convenção já existente, não uma decisão de governança nova.

---

# 4. Documentação

Auditar e, se necessário, corrigir **somente** inconsistências diretamente relacionadas ao
encerramento desta sprint em:

- `PROJECT_STATUS.md`
- `CHANGELOG.md`
- `README.md`
- `ARCHITECTURE.md`
- demais documentos que citem a sprint diretamente

Buscar explicitamente por resíduos como:

```bash
grep -rn "SPR-XXX" --include=*.md . | grep -i "em andamento\|aguardando aprovação\|pendente"
```

- [ ] Nenhuma referência residual a "em andamento", "aguardando aprovação" ou "pendente" para a
  sprint encerrada
- [ ] `CHANGELOG.md` atualizado sem criar uma versão SemVer artificial — versão só é atribuída no
  momento real de uma release (ver `VISION.md`)
- [ ] Histórico já publicado no `CHANGELOG.md` não é reescrito — apenas notas vivas (ex.:
  "Known Limitations") são atualizadas, e somente quando a pendência que descreviam foi de fato
  resolvida
- [ ] Nenhuma refatoração documental ampla, reorganização de documentos ou alteração de
  roadmap/arquitetura não relacionada ao encerramento

> **Aprendizado da SPR-009:** essa auditoria frequentemente revela inconsistências documentais
> de sprints **anteriores**, não relacionadas à sprint sendo encerrada (ex.: um Design Doc de
> sprint antiga nunca promovido a `Accepted`, um backlog de sprint antiga nunca marcado como
> concluído). Essas inconsistências devem ser **reportadas, não corrigidas** — corrigir
> documentação de outra sprint está fora do escopo do encerramento desta.

---

# 5. Verificação Final Git/GitHub

```bash
git status
git branch -vv
git branch -r
git fetch --prune
```

- [ ] Working tree limpo
- [ ] `main` sincronizada com `origin/main`
- [ ] Branches temporárias da sprint (`validation/spr-xxx-*`) removidas
- [ ] `git fetch --prune` não revela branches remotas órfãs adicionais
- [ ] Confirmado que a sprint foi efetivamente mergeada em `main` — não apenas que os blocos
  individuais foram aprovados isoladamente

---

# 6. Critério Formal de Encerramento

Uma sprint só pode ser considerada formalmente encerrada quando **todos** os itens abaixo forem
verdadeiros:

1. Todos os blocos previstos foram implementados.
2. Todos os blocos foram aprovados individualmente pelo Arquiteto-Chefe.
3. Os critérios de aceite do backlog foram atendidos.
4. Testes (unitários, E2E quando aplicável), lint e build estão verdes no estado final de
   `main`.
5. A documentação está consistente — sem referências residuais a estados anteriores da sprint.
6. A governança das ADRs/Design Doc foi resolvida, segundo a convenção já existente no
   repositório.
7. As alterações foram efetivamente mergeadas em `main`.
8. `main` está limpa e sincronizada com `origin/main`.
9. Não existem branches temporárias órfãs relacionadas à sprint.
10. O Arquiteto-Chefe aprovou formalmente o encerramento.

Se qualquer item não for atendido, a sprint **não** está encerrada — mesmo que a implementação
técnica esteja tecnicamente completa.

---

# Checklist

- [ ] Auditoria inicial do Git (Seção 1) concluída, sem alterações
- [ ] Validação técnica (Seção 2) verde
- [ ] Governança de ADRs/Design Doc/backlog resolvida (Seção 3)
- [ ] Documentação consistente (Seção 4)
- [ ] Verificação final Git/GitHub (Seção 5)
- [ ] Todos os 10 critérios formais de encerramento (Seção 6) atendidos
- [ ] Patch de encerramento gerado, validado (`git apply --check`) e **não aplicado**, aguardando
  aprovação explícita do Arquiteto-Chefe
- [ ] Nenhuma próxima sprint iniciada antes dessa aprovação
