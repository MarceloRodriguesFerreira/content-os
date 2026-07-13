# ADR-001 — Technology Stack

## Status

Accepted

## Context

O projeto necessita de uma arquitetura moderna, escalável e preparada para crescimento.

## Decision

A stack oficial será:

- Monorepo: Turborepo
- Package Manager: pnpm
- Frontend: Next.js
- Backend: NestJS
- ORM: Prisma
- Banco de Dados: PostgreSQL
- Containers: Docker

## Consequences

Toda nova funcionalidade deverá seguir esta stack.
Mudanças de tecnologia exigirão um novo ADR.