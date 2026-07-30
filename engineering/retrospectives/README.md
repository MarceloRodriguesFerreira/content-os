# engineering/retrospectives/README.md

# Retrospectivas Técnicas

## Objetivo

Esta pasta reúne as retrospectivas técnicas de cada sprint do Content-OS.

As retrospectivas registram os principais aprendizados obtidos durante a execução de cada sprint, permitindo que decisões, dificuldades e melhorias de processo sejam preservadas ao longo da evolução do projeto.

Diferentemente dos documentos de arquitetura (ADRs e Design Documents), as retrospectivas descrevem **como a sprint ocorreu**, quais desafios surgiram e quais ajustes passaram a fazer parte do processo de engenharia.

---

# Quando uma retrospectiva deve ser criada

Uma retrospectiva deve ser criada **somente após**:

- implementação concluída;
- validação técnica concluída;
- Design Freeze realizado;
- Pull Request aprovado;
- Merge realizado na branch `main`.

Ou seja, a retrospectiva representa a visão final da sprint, já consolidada.

---

# Estrutura padrão

Toda retrospectiva deve conter, no mínimo, as seguintes seções:

```text
Objetivo

O que foi entregue

O que funcionou bem

Problemas encontrados

Como foram resolvidos

Lições aprendidas

Melhorias para o processo

Impacto nas próximas sprints

Resultado
```

---

# Escopo

As retrospectivas devem registrar apenas fatos ocorridos durante a sprint.

Não devem conter:

- planejamento futuro;
- funcionalidades ainda não implementadas;
- decisões hipotéticas;
- mudanças arquiteturais não aprovadas.

Esses assuntos pertencem aos Design Documents ou ADRs.

---

# Relação com outros documentos

Cada sprint do Content-OS passa pelos seguintes artefatos:

```
Planejamento
        ↓
Design Document
        ↓
Aprovação
        ↓
Implementação
        ↓
Validação Técnica
        ↓
Design Freeze
        ↓
Pull Request
        ↓
Merge
        ↓
Retrospectiva Técnica
```

Cada documento possui um papel específico:

| Documento | Objetivo |
|-----------|----------|
| Design Document | Planejar a solução antes da implementação |
| ADR | Registrar decisões arquiteturais permanentes |
| Retrospectiva | Registrar aprendizados e evolução do processo |

---

# Convenção de nomes

Utilizar sempre:

```
SPR-001-retrospective.md
SPR-002-retrospective.md
SPR-003-retrospective.md
...
```

---

# Benefícios

As retrospectivas permitem:

- preservar conhecimento técnico;
- registrar decisões operacionais importantes;
- reduzir repetição de erros;
- melhorar continuamente o processo de engenharia;
- facilitar a entrada de novos desenvolvedores;
- manter um histórico confiável da evolução do projeto.

---

# Responsabilidade

A retrospectiva deve ser produzida ao final de cada sprint pelo responsável técnico da implementação e revisada antes do encerramento oficial da sprint.

Ela passa a fazer parte da documentação permanente do projeto.
