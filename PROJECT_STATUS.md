# 🚀 Content OS

> Plataforma inteligente para criação, gerenciamento e publicação de conteúdo para Instagram.

---

# Status do Projeto

**Versão Atual**

0.1.0

**Status**

🟢 Em Desenvolvimento

**Sprint Atual**

Sprint 004 — Fundação de Persistência

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
- [x] Módulo Health
- [x] Docker Compose
- [x] PostgreSQL
- [x] Prisma (client + migrations)
- [x] Configuração Centralizada (AppConfigModule/AppConfigService)
- [x] Fundação de Persistência (lifecycle, graceful shutdown, testes)

---

# Sprint Atual

## Objetivo

Consolidar a camada de persistência (PrismaModule/PrismaService): lifecycle,
graceful shutdown, logging, tratamento de erro e testabilidade.

## Backlog

- [x] Docker Compose
- [x] PostgreSQL
- [x] Prisma
- [x] Primeira Migration
- [ ] Swagger
- [x] Configuração Centralizada
- [x] Graceful Shutdown do Prisma
- [x] Logging de lifecycle do Prisma
- [x] Testes unitários do PrismaService
- [x] Correção da suíte de testes (Jest + Prisma 7 / ESM)

---

# Roadmap

## MVP

- [ ] Editor de Conteúdo
- [ ] Biblioteca de Templates
- [ ] Gerenciamento de Projetos
- [ ] Upload de Imagens
- [ ] IA para geração de conteúdo
- [ ] Integração Instagram
- [ ] Agendamento de Publicações

---

# Developer Experience

Planejado

- [ ] pnpm check
- [ ] pnpm quality
- [ ] pnpm reset
- [ ] pnpm setup

---

# Arquitetura

Documentação disponível em:

engineering/

- ADRs
- Runbooks
- Standards
- Checklists

---

# Último Marco

✅ Fundação de persistência consolidada (SPR-004).

- PrismaModule / PrismaService com lifecycle robusto
- Graceful shutdown
- Logging e tratamento de erro de conexão
- Suíte de testes (unitária e e2e) corrigida para Prisma 7

---

# Próximo Marco

A definir pelo Arquiteto de Software / Tech Lead (Release 0.2 — Segurança).

---

Última atualização:

21/07/2026