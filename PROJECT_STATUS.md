# 🚀 Content OS

> Plataforma inteligente para criação, gerenciamento e publicação de conteúdo para Instagram.

---

# Documentação Principal

| Documento | Finalidade |
|-----------|------------|
| README.md | Como instalar, configurar e executar o projeto |
| VISION.md | Visão do produto, objetivos estratégicos e roadmap de longo prazo |
| PROJECT_STATUS.md | Estado atual do desenvolvimento |
| engineering/ | Documentação técnica (ADRs, Designs, Runbooks, Standards e Checklists) |

---

# Status do Projeto

## Versão Atual

**0.2.0**

## Status

🟢 Em Desenvolvimento

## Sprint Atual

**Sprint 005 — Documentação da API (Swagger/OpenAPI)**

---

# Stack Oficial

## Frontend

- Next.js
- React
- TypeScript

## Backend

- NestJS
- TypeScript

## Banco

- PostgreSQL

## ORM

- Prisma

## Monorepo

- Turborepo
- pnpm

## Containers

- Docker

---

# Funcionalidades Concluídas

## Infraestrutura

- [x] Repositório Git
- [x] Monorepo Turborepo
- [x] Workspace pnpm
- [x] Frontend Next.js
- [x] Backend NestJS
- [x] Docker Compose
- [x] PostgreSQL
- [x] Prisma (client + migrations)
- [x] Configuração Centralizada (AppConfigModule/AppConfigService)
- [x] Fundação de Persistência (lifecycle, graceful shutdown, testes)

---

# Sprint Atual (SPR-005)

## Objetivo

Documentar toda a API utilizando Swagger/OpenAPI e estabelecer o padrão que será seguido pelos próximos módulos do sistema.

## Backlog

- [ ] Swagger
- [ ] OpenAPI
- [ ] Documentação automática dos endpoints
- [ ] Versionamento da API
- [ ] DTOs documentados
- [ ] Padronização das respostas
- [ ] Ambiente `/api/docs`

---

# Roadmap

O roadmap estratégico completo encontra-se em:

**VISION.md**

---

# Developer Experience

Planejado

- [ ] pnpm check
- [ ] pnpm quality
- [ ] pnpm setup
- [ ] pnpm reset

---

# Estado da Plataforma

| Camada | Status |
|---------|--------|
| Frontend | ✅ Inicializado |
| Backend | ✅ Operacional |
| PostgreSQL | ✅ Operacional |
| Prisma ORM | ✅ Operacional |
| Configuração Centralizada | ✅ Operacional |
| Testes Unitários | ✅ Operacional |
| Testes E2E | ✅ Operacional |
| Swagger | ⬜ Planejado |
| Autenticação | ⬜ Planejado |
| Deploy | ⬜ Planejado |

---

# Arquitetura

A arquitetura oficial encontra-se em:

ARCHITECTURE.md

Decisões arquiteturais detalhadas:

engineering/

- ADRs
- Design Docs
- Runbooks
- Standards
- Checklists

---

# Último Marco

## ✅ SPR-004 — Fundação de Persistência

Objetivo alcançado com sucesso.

### Entregas

- PrismaModule consolidado
- PrismaService desacoplado
- Lifecycle completo
- Graceful Shutdown
- Logging de inicialização
- Logging de encerramento
- Tratamento de falhas de conexão
- Testes Unitários
- Testes E2E
- Compatibilidade Prisma 7
- Compatibilidade Jest 29 + ts-jest
- Configuração Centralizada via AppConfigModule
- AppConfigService tipado
- Carregamento automático do `.env` em ambiente de monorepo

---

# Lições Aprendidas

Durante a implementação da SPR-004 foram identificados alguns pontos importantes.

## Configuração

- Em monorepos o `process.cwd()` pode variar conforme o comando executado.
- O carregamento do `.env` deve considerar diferentes diretórios.

## Testes

- NestJS 11 ainda utiliza Jest 29.
- Jest 30 não é compatível com ts-jest 29.

Versões homologadas:

- Jest 29.7.x
- ts-jest 29.4.x
- @types/jest 29.5.x

## Prisma

- Prisma 7 exige cuidados com lifecycle.
- O shutdown precisa ser explícito.
- A conexão deve ser encerrada corretamente para evitar handles abertos.

---

# Próximos Marcos

## Release 0.3.0

- Swagger
- OpenAPI
- Padronização da documentação

## Release 0.4.0

- Autenticação JWT
- Usuários
- Controle de acesso

## Release 0.5.0

- Projetos
- Organização de Conteúdo

## Release 0.6.0

- Editor de Conteúdo

## Release 0.7.0

- Templates

## Release 0.8.0

- IA para geração de conteúdo

## Release 1.0.0

Primeira versão pública do Content OS.

---

# Histórico de Releases

| Versão | Data | Marco |
|---------|------|-------|
| 0.1.0 | Julho/2026 | Fundação do Monorepo |
| 0.2.0 | Julho/2026 | Fundação de Persistência |
| 0.3.0 | Planejado | Swagger/OpenAPI |
| 0.4.0 | Planejado | Autenticação |
| 0.5.0 | Planejado | Projetos |
| 0.6.0 | Planejado | Editor |
| 0.7.0 | Planejado | Templates |
| 0.8.0 | Planejado | IA |
| 1.0.0 | Planejado | MVP Público |

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
| Lint | ✅ |
| Build | ✅ |
| Swagger | ⬜ |
| CI/CD | ⬜ |

---

# Próxima Sprint

## SPR-005

### Objetivo

Implementar a documentação da API utilizando Swagger/OpenAPI, estabelecendo um padrão único para todos os módulos futuros.

### Resultado Esperado

Ao final da sprint será possível acessar:

```
http://localhost:3001/api/docs
```

com toda a documentação da API disponível automaticamente.

---

Última atualização:

**21/07/2026**
