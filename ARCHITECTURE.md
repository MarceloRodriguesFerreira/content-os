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
```

Nenhum Controller acessa Prisma diretamente.

Toda regra de negócio fica nos Services.

Autenticação (quem é o usuário) e autorização (o que ele pode fazer) são camadas distintas:
`JwtAuthGuard` é global (ADR-002); `RolesGuard` é aplicado apenas nas rotas que declaram
`@Roles(...)` (ADR-004).

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

# Próximas Evoluções

Release 0.3

- Swagger

Release 0.4

- JWT

> Nota: JWT e RBAC foram entregues antes da numeração de release acima ser alcançada (SPR-007 e
> SPR-008, respectivamente, ambas dentro da faixa `0.2.x`/`0.3.x`). A consolidação da numeração
> deste roadmap com o `CHANGELOG.md`/`PROJECT_STATUS.md` é um débito documental já registrado,
> não tratado nesta sprint por estar fora do seu escopo.

Release 0.6

- Upload

Release 0.7

- IA

Release 1.0

- Produção
