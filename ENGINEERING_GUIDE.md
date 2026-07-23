# 🛠️ Engineering Guide — Content-OS

> Processo oficial de engenharia do Content-OS: como o time (humano ou IA) planeja, documenta, implementa e valida trabalho neste repositório.

---

## Objetivo do documento

Este documento existe para responder uma pergunta recorrente: **"onde eu registro isso, e como?"**

`VISION.md`, `ARCHITECTURE.md` e `PROJECT_STATUS.md` dizem **o quê** o produto é e **em que estado** ele está. Este guia diz **como** o trabalho de engenharia é conduzido no dia a dia: fluxo de sprint, quando abrir cada tipo de documento em `engineering/`, convenções de commit/branch, e o que precisa ser verdadeiro para uma entrega ser considerada concluída.

Ele não substitui nenhum documento oficial existente — ele é o elo entre eles.

---

## Fluxo oficial de desenvolvimento

1. A sprint corrente e o backlog imediato vivem em `PROJECT_STATUS.md`.
2. Antes de implementar, verifica-se se a sprint exige um **Design Doc** (ver critério abaixo). Se exigir, ele é criado em `engineering/designs/` antes do código.
3. Decisões técnicas que fixam ou mudam um padrão do projeto (stack, biblioteca, convenção) geram uma **ADR** em `engineering/adr/`.
4. O código é implementado seguindo `ARCHITECTURE.md` e `engineering/standards/`.
5. Ao concluir, a sprint é validada contra a **Definition of Done** (ver seção própria).
6. `CHANGELOG.md` e `PROJECT_STATUS.md` são atualizados conforme as políticas descritas abaixo.
7. Checkpoints arquiteturais (auditorias completas) podem ser executados entre sprints para validar consistência antes de iniciar a próxima — não são obrigatórios a cada sprint, mas recomendados antes de mudanças estruturais grandes (ex: antes de uma sprint que introduz um novo domínio ou dependência externa relevante).

---

## Organização da documentação

| Camada | Onde vive | Responde a |
|---|---|---|
| Produto | `README.md`, `VISION.md` | O que é o Content-OS, para quem, e por quê |
| Arquitetura | `ARCHITECTURE.md` | Como o sistema é construído tecnicamente, hoje |
| Estado do projeto | `PROJECT_STATUS.md` | O que já foi feito, o que está em andamento, o que vem a seguir |
| Histórico | `CHANGELOG.md` | O que mudou, release a release |
| Processo | `ENGINEERING_GUIDE.md` (este documento) | Como o time trabalha |
| Como contribuir | `CONTRIBUTING.md` | Passos práticos para propor uma mudança |
| Engenharia detalhada | `engineering/` | ADRs, Design Docs, Runbooks, Checklists, Templates |

**Regra geral:** visão de produto, arquitetura e roadmap têm **fonte única** nos documentos da raiz. `engineering/` não deve conter documentos concorrentes sobre o que o produto é — apenas material de apoio à execução técnica.

---

## Quando criar ADR

Uma ADR (`engineering/adr/ADR-XXX-titulo.md`) é criada quando uma decisão:

- Fixa ou muda a **stack tecnológica** (linguagem, framework, banco, ORM, provedor externo);
- Estabelece um **padrão que vale para todo o projeto daí em diante** (ex: "toda configuração passa pelo AppConfigService");
- É **difícil ou cara de reverter** depois de adotada;
- Resolve uma discussão entre alternativas técnicas concorrentes e o motivo da escolha precisa ficar registrado.

Não é necessário criar ADR para decisões locais de implementação (nome de uma variável, estrutura interna de uma função) — isso é código, não decisão arquitetural.

---

## Quando criar Design Doc

Um Design Doc (`engineering/designs/SPR-XXX-nome.md`) é criado **antes** de implementar uma sprint quando:

- A sprint introduz um módulo novo ou reestrutura um existente;
- Existem múltiplas abordagens técnicas razoáveis e vale registrar qual foi escolhida e por quê;
- O trabalho terá impacto em módulos além do escopo imediato da sprint (ex: introduzir configuração centralizada afeta todo o resto da API).

Sprints puramente de manutenção, correção de bug pontual ou ajuste de documentação **não exigem** Design Doc.

---

## Quando criar Runbook

Um Runbook (`engineering/runbooks/`) é criado quando existe um **procedimento operacional repetível** que alguém (humano ou IA) vai precisar executar mais de uma vez — ex: preparar uma estação de trabalho nova, subir o ambiente local, executar uma migration em produção. Runbook é sobre **como fazer**, passo a passo, não sobre **por que decidimos fazer assim** (isso é ADR) nem **o que vamos construir** (isso é Design Doc).

---

## Quando criar Checklist

Um Checklist (`engineering/checklists/`) é criado para marcos que precisam de **verificação binária e repetível** antes de avançar — ex: "ambiente de desenvolvimento está pronto?", "sprint está pronta para ser dada como concluída?". Diferente de um Runbook (que ensina a fazer), o Checklist só confirma que algo já foi feito corretamente.

---

## Estrutura da pasta `engineering/`

```
engineering/
├── adr/           → Decisões arquiteturais (ADR-001, ADR-002, ...)
├── designs/       → Design Docs por sprint (SPR-XXX-nome.md)
├── runbooks/      → Procedimentos operacionais repetíveis
├── checklists/    → Listas de verificação por marco/checkpoint
├── standards/     → Convenções vigentes (git, nomenclatura, etc.)
├── templates/     → Modelos-base para ADR, Design Doc, Runbook e Checklist
└── ai/            → Material de orientação para uso de assistentes de IA neste repositório
```

> **Nota de status:** as pastas `engineering/templates/` e `engineering/ai/` ainda **não existem** neste repositório — a estrutura acima descreve a convenção-alvo, não o estado atual. A criação do conteúdo real dessas duas pastas é trabalho pendente, fora do escopo deste documento (que é apenas o hotfix da referência a este próprio arquivo). Ver seção "Templates disponíveis" e "Materiais para IA" abaixo para o que se espera de cada uma quando forem criadas.

---

## Templates disponíveis

Quando `engineering/templates/` for populada, ela deve conter um modelo mínimo para cada tipo de documento deste guia:

- `template-adr.md` — esqueleto de ADR (Status, Contexto, Decisão, Consequências);
- `template-design-doc.md` — esqueleto de Design Doc (Contexto, Decisão, Componentes, Consequências), seguindo o formato já usado em `engineering/designs/SPR-003-configuration-module.md` e `SPR-004-persistence-foundation.md`;
- `template-runbook.md` — esqueleto de Runbook (Objetivo, Pré-requisitos, Passos, Validação);
- `template-checklist.md` — esqueleto de Checklist (lista de itens `- [ ]` agrupados por categoria).

Até que esses arquivos existam, os documentos já escritos em `engineering/adr/`, `engineering/designs/`, `engineering/runbooks/` e `engineering/checklists/` servem como referência de formato de fato.

---

## Materiais para IA (`engineering/ai`)

Quando criada, esta pasta deve conter orientações para qualquer assistente de IA (Claude, ChatGPT, Copilot ou outro) que for usado para ler ou modificar este repositório — cobrindo, no mínimo:

- Quais documentos ler antes de propor qualquer mudança (`VISION.md`, `ARCHITECTURE.md`, `PROJECT_STATUS.md`, este guia);
- As restrições arquiteturais não-negociáveis do projeto (ex: configuração exclusivamente via `AppConfigService`, nenhum acesso direto a `process.env` fora de `configuration.ts`);
- Como a IA deve se comportar diante de documentação ausente ou desatualizada (reportar a divergência, não silenciosamente inventar conteúdo ou assumir que algo existe sem verificar);
- O nível de autonomia esperado (ex: quando é aceitável implementar direto vs. quando é necessário apresentar plano antes).

---

## Fluxo de Sprint

1. Sprint é definida em `PROJECT_STATUS.md` com objetivo claro.
2. Se aplicável, Design Doc é escrito em `engineering/designs/` antes do código.
3. Implementação segue `ARCHITECTURE.md` e `engineering/standards/`.
4. Testes unitários são escritos para todo módulo novo ou alterado.
5. Build, lint e testes são validados localmente antes do commit.
6. Commit segue Conventional Commits (ver "Boas práticas de commits").
7. `CHANGELOG.md` e `PROJECT_STATUS.md` são atualizados (ver políticas abaixo).
8. Sprint é marcada como concluída em `PROJECT_STATUS.md` somente após a Definition of Done ser satisfeita.

---

## Definition of Done

Uma sprint só é considerada concluída quando, cumulativamente:

- [ ] O código implementa exatamente o que o Design Doc (quando existente) descreveu, ou o desvio foi justificado e registrado;
- [ ] `pnpm lint` passa sem erros;
- [ ] `pnpm --filter api test` (ou equivalente do pacote afetado) passa sem falhas;
- [ ] `pnpm --filter api build` (ou equivalente) conclui sem erros;
- [ ] Todo módulo novo ou alterado possui teste unitário correspondente;
- [ ] Nenhuma regra do `ARCHITECTURE.md` foi violada (ex: acesso direto a `process.env`, acoplamento indevido entre módulos);
- [ ] `CHANGELOG.md` e `PROJECT_STATUS.md` refletem exatamente o que foi entregue — **nenhuma entrega é registrada como concluída antes de existir de fato no repositório**;
- [ ] Nenhuma referência quebrada foi introduzida na documentação.

---

## Política de documentação

- Visão de produto, arquitetura de alto nível e roadmap têm fonte única na raiz (`VISION.md`, `ARCHITECTURE.md`, `PROJECT_STATUS.md`). Não se cria documento equivalente em `engineering/`.
- Documentação é atualizada **no mesmo ciclo de trabalho** em que a mudança acontece — não em lote, depois, de memória.
- Nenhum documento declara uma entrega como feita ("Added") antes do artefato correspondente existir de fato no repositório. Se algo foi planejado mas não entregue, isso pertence ao backlog em `PROJECT_STATUS.md`, não ao `CHANGELOG.md`.
- Divergências encontradas entre documentos (ou entre documento e código) são corrigidas assim que identificadas, preferencialmente via um commit dedicado (`docs: ...`), não misturadas em commits de feature.

---

## Política de atualização do CHANGELOG

- Segue o formato `## [versão] - AAAA-MM-DD`, com seções `Added`/`Changed`/`Fixed` conforme Keep a Changelog.
- Só entra em `Added` o que já está de fato commitado no repositório no momento do registro.
- Atualizado ao final de cada sprint ou release, nunca de forma especulativa (não se documenta o que ainda será feito).

---

## Política de atualização do PROJECT_STATUS

- Reflete o estado real e verificável do projeto: sprints concluídas, sprint atual, backlog imediato.
- Uma sprint só é movida para "concluída" depois de passar pela Definition of Done desta guia.
- A tabela de "Documentação Oficial" em `PROJECT_STATUS.md` só referencia documentos que de fato existem no repositório no momento da atualização.

---

## Boas práticas de commits

Conventional Commits (já definido em `engineering/standards/git.md`):

```
feat:     nova funcionalidade
fix:      correção de bug
docs:     documentação
refactor: mudança de código sem alterar comportamento
test:     testes
chore:    manutenção, tarefas de build/tooling
```

Mensagens descrevem o que muda, não o processo usado para chegar lá (ex.: preferir `feat: implementa configuration module (SPR-003)` a `chore: ajustes diversos`).

---

## Boas práticas de branches

- `main` — sempre estável, sempre buildável.
- `feature/<nome-da-feature>` — uma branch por sprint ou funcionalidade.
- Branches de feature são de vida curta: mescladas e removidas assim que o trabalho é incorporado à `main`. Branches obsoletas (superadas por trabalho equivalente já mesclado por outro caminho) devem ser auditadas quanto a conteúdo exclusivo antes de excluídas — não descartadas por padrão sem essa checagem.
- Pull Requests passam pelos checklists definidos pelo projeto antes do merge.

---

## Referências

- [`README.md`](./README.md) — instalação, configuração e execução do projeto.
- [`VISION.md`](./VISION.md) — visão do produto e roadmap estratégico.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — arquitetura oficial do sistema.
- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — estado atual do desenvolvimento.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — guia de contribuição.
