# 🚀 Content-OS

> Plataforma inteligente para criação, organização e publicação de conteúdo para redes sociais utilizando Inteligência Artificial.

---

# Documentação Oficial

| Documento | Finalidade |
|-----------|------------|
| README.md | Instalação, configuração e execução do projeto |
| VISION.md | Visão do produto e roadmap estratégico |
| ARCHITECTURE.md | Arquitetura oficial do sistema |
| PROJECT_STATUS.md | Estado atual do desenvolvimento |
| CHANGELOG.md | Histórico de releases |
| CONTRIBUTING.md | Guia de contribuição |
| ENGINEERING_GUIDE.md | Processo oficial de engenharia |
| engineering/ | ADRs, Design Docs, Runbooks, Standards, Templates e Checklists |

---

# Status do Projeto

## Versão Atual

**0.2.0**

## Status

🟢 Em Desenvolvimento

## Sprint Atual

**SPR-005 — Documentação da API (Swagger/OpenAPI)**

Última atualização:

**23/07/2026**

---

# Stack Oficial

## Frontend

- Next.js
- React
- TypeScript

## Backend

- NestJS 11
- TypeScript

## Banco de Dados

- PostgreSQL

## ORM

- Prisma 7

## Monorepo

- Turborepo
- pnpm

## Containers

- Docker

---

# Estado da Plataforma

| Camada | Status |
|---------|--------|
| Frontend | ✅ Operacional |
| Backend | ✅ Operacional |
| PostgreSQL | ✅ Operacional |
| Prisma ORM | ✅ Operacional |
| Configuração Centralizada | ✅ Operacional |
| Testes Unitários | ✅ Operacional |
| Testes E2E | ✅ Operacional |
| Swagger/OpenAPI | ⬜ Planejado |
| Autenticação | ⬜ Planejado |
| CI/CD | ⬜ Planejado |
| Deploy | ⬜ Planejado |

---

# Funcionalidades Concluídas

## Fundação

- ✅ Monorepo (Turborepo + pnpm)
- ✅ Frontend Next.js
- ✅ Backend NestJS
- ✅ Docker Compose
- ✅ PostgreSQL
- ✅ Prisma ORM
- ✅ Primeira Migration
- ✅ Configuração Centralizada (AppConfigModule / AppConfigService)
- ✅ Fundação de Persistência
- ✅ Graceful Shutdown
- ✅ Logging do Prisma
- ✅ Testes Unitários
- ✅ Testes E2E

---

# Sprint Atual

## Objetivo

Implementar a documentação completa da API utilizando Swagger/OpenAPI, estabelecendo um padrão único para todos os módulos futuros.

## Backlog

- [ ] Configuração do Swagger
- [ ] OpenAPI
- [ ] Versionamento da API
- [ ] Documentação automática dos endpoints
- [ ] DTOs documentados
- [ ] Padronização das respostas
- [ ] Ambiente `/api/docs`

---

# Developer Experience

Planejado

- [ ] pnpm check
- [ ] pnpm quality
- [ ] pnpm setup
- [ ] pnpm reset

---

# Último Marco

## ✅ Release 0.2.0 — Fundação concluída

### Principais entregas

- Configuração Centralizada
- Fundação de Persistência
- Prisma estabilizado
- Graceful Shutdown
- Logging do lifecycle
- Testes Unitários
- Testes E2E
- Documentação consolidada
- Processo oficial de Engenharia

---

# Lições Aprendidas

## Configuração

- Em monorepos o `process.cwd()` pode variar conforme o comando executado.
- O carregamento do `.env` deve considerar diferentes diretórios.

## Testes

Versões homologadas:

- Jest 29.7.x
- ts-jest 29.4.x
- @types/jest 29.5.x

## Prisma

- O lifecycle precisa ser controlado explicitamente.
- Toda conexão deve ser encerrada corretamente.
- Graceful Shutdown evita conexões pendentes.

---

# Próximo Marco

## Release 0.3.0

Documentação completa da API com Swagger/OpenAPI.

---

# Indicadores Técnicos

| Indicador | Situação |
|-----------|----------|
| TypeScript | ✅ |
| NestJS | ✅ |
| Prisma | ✅ |
| PostgreSQL | ✅ |
| Docker | ✅ |
| Configuração Centralizada | ✅ |
| Testes Unitários | ✅ |
| Testes E2E | ✅ |
| Build | ✅ |
| Lint | ✅ |
| Swagger | ⬜ |
| CI/CD | ⬜ |

---

# Próxima Sprint

## SPR-005

### Objetivo

Implementar Swagger/OpenAPI como documentação oficial da API.

### Resultado Esperado

Disponibilizar a documentação automática em:

```
http://localhost:3001/api/docs
```

para servir como padrão para todos os módulos futuros.
