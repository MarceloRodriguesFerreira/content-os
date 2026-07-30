# engineering/retrospectives/SPR-005-retrospective.md

# SPR-005 — Retrospectiva Técnica

**Sprint:** Swagger / OpenAPI

**Status:** Concluída

---

# Objetivo

Disponibilizar documentação automática da API utilizando OpenAPI.

---

# O que foi entregue

- Swagger
- OpenAPI
- swagger.config.ts
- Documentação automática
- Health documentado

---

# O que funcionou bem

A documentação passou a ser gerada automaticamente.

Facilitou a validação manual da API.

---

# Problemas encontrados

O patch foi aplicado localmente.

Entretanto, a branch não foi integrada imediatamente à main.

Isso gerou inconsistências durante o início da SPR-007.

---

# Solução adotada

Foi realizada revisão completa do fluxo Git.

Foi criada uma sequência oficial:

- Feature Branch
- Patch
- Validação
- Commit
- Push
- Pull Request
- Merge

---

# Lições aprendidas

Não basta aplicar patches localmente.

É necessário validar que o código realmente chegou à branch principal.

---

# Melhorias para o processo

Antes de iniciar qualquer sprint:

- atualizar main
- confirmar merge da sprint anterior
- sincronizar repositório local

---

# Resultado

O Swagger tornou-se parte permanente da infraestrutura do projeto e estabeleceu a base para documentação das APIs futuras.
