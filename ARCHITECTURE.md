# 🏗️ Content OS Architecture

> Arquitetura oficial do projeto Content OS.

---

# Objetivo

Este documento descreve a arquitetura de alto nível do sistema.

Para decisões arquiteturais específicas consulte:

engineering/adr/

---

# Visão Geral

```
                    Internet
                        │
                        │
                Next.js Frontend
                        │
                        │ REST
                        ▼
                NestJS Backend API
                        │
             Prisma ORM / Services
                        │
                        ▼
                  PostgreSQL
```

---

# Stack Oficial

## Frontend

- Next.js
- React
- TypeScript

---

## Backend

- NestJS
- TypeScript

---

## Persistência

- Prisma ORM
- PostgreSQL

---

## Infraestrutura

- Docker
- Docker Compose

---

## Monorepo

- Turborepo
- pnpm Workspaces

---

# Estrutura do Repositório

```
apps/
    api/
    web/

packages/
    ui/
    eslint-config/
    typescript-config/

engineering/
```

---

# Organização em Camadas

```
ValidationPipe (validação de entrada, global)

↓

JwtAuthGuard (autenticação, global)

↓

RolesGuard (autorização, por rota — @Roles())

↓

Controller

↓

Service

↓

Repository (Prisma)

↓

PostgreSQL

↓

TransformInterceptor (padronização de resposta de sucesso, global)
```

Em qualquer ponto de falha, `AllExceptionsFilter` (global) padroniza a resposta de erro.

Nenhum Controller acessa Prisma diretamente.

Toda regra de negócio fica nos Services.

Autenticação (quem é o usuário) e autorização (o que ele pode fazer) são camadas distintas:
`JwtAuthGuard` é global (ADR-002); `RolesGuard` é aplicado apenas nas rotas que declaram
`@Roles(...)` (ADR-004). Autorização por propriedade de recurso é um terceiro tipo, também não
global: `ProjectOwnershipGuard` (ADR-009) é aplicado explicitamente via `@UseGuards(...)` apenas
nas rotas de um módulo de domínio que operam sobre um recurso específico (`:id`), verificando se
quem faz a requisição é o dono do recurso (ou tem papel administrativo) — não é um guard
compartilhado entre módulos; cada agregado de domínio com essa necessidade declara o seu
próprio, seguindo o mesmo YAGNI já registrado para DTOs de query por módulo (`ADR-010`).

Validação de entrada e padronização de resposta são camadas de HTTP Pipeline, ortogonais às
regras de negócio: `ValidationPipe` (ADR-003), `AllExceptionsFilter` e `TransformInterceptor`
(ADR-007) — todos globais, registrados via token de DI (`APP_PIPE`/`APP_FILTER`/
`APP_INTERCEPTOR`) para que produção e testes E2E usem exatamente o mesmo pipeline.

---

# Configuração

Toda configuração passa pelo:

AppConfigModule

↓

AppConfigService

↓

@nestjs/config

↓

.env

Nenhum módulo deve acessar process.env diretamente.

---

# Persistência

A persistência utiliza Prisma ORM.

Responsabilidades do PrismaModule:

- conexão
- lifecycle
- graceful shutdown
- logging
- tratamento de erro

---

# Padrões Adotados

- Dependency Injection
- SOLID
- Clean Architecture (adaptada)
- Repository Pattern
- Configuração Centralizada
- Modularização por Feature

---

# Convenções

- Controllers sem regra de negócio
- Services desacoplados
- DTOs obrigatórios
- ValidationPipe global
- Swagger obrigatório

---

# Roadmap

O roadmap estratégico do produto (sequência de marcos, não uma atribuição fixa de número de
versão por marco) vive exclusivamente em `VISION.md`, seção "Roadmap Estratégico" — conforme a
própria tabela de propósito documental deste projeto (`README.md`/`PROJECT_STATUS.md`): a
visão de produto e o roadmap pertencem a `VISION.md`; este documento (`ARCHITECTURE.md`) trata
de arquitetura, não de roadmap.

Este arquivo mantinha até a SPR-009 uma segunda lista de "Próximas Evoluções" com números de
release próprios, que divergia de `VISION.md` em conteúdo (itens diferentes sob os mesmos
números) e do `CHANGELOG.md` em fato (recursos listados como "futuros" que já haviam sido
entregues). A causa raiz era ter duas fontes de verdade para a mesma informação — removida aqui,
não apenas corrigida pontualmente, para não voltar a divergir a cada sprint.

Números de versão real (SemVer) são atribuídos no momento em que uma release é de fato marcada,
registrados em `CHANGELOG.md` — nunca reservados antecipadamente por item de roadmap.
