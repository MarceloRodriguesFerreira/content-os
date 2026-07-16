# Arquitetura do Content-OS

## Objetivo

O Content-OS é uma plataforma modular para gestão empresarial, construída com foco em escalabilidade, manutenibilidade e segurança.

A arquitetura prioriza baixo acoplamento, alta coesão e evolução incremental.

---

# Stack Tecnológica

## Frontend

- Next.js
- React
- TypeScript

## Backend

- NestJS 11
- TypeScript
- Prisma 7

## Banco de Dados

- PostgreSQL 16

## Infraestrutura

- Docker
- Turborepo
- pnpm Workspace

---

# Princípios Arquiteturais

O projeto adota os seguintes princípios:

- SOLID
- Clean Code
- Modularização por domínio
- Dependency Injection
- Evolução incremental da Clean Architecture
- Convention over Configuration

---

# Estrutura do Repositório

```
apps/
    api/
    web/

packages/

docker/

engineering/
```

---

# Organização da API

A API é organizada em módulos do NestJS.

Cada módulo deve possuir responsabilidade única.

Exemplo:

```
modules/

    auth/

    users/

    companies/

    products/

    guarantees/
```

---

# Persistência

Toda persistência deverá utilizar Prisma.

Não será utilizado SQL diretamente na camada de negócio.

---

# Configuração

Toda configuração deverá passar pelo ConfigModule.

Nenhum módulo poderá acessar process.env diretamente.

---

# Banco de Dados

Banco oficial:

PostgreSQL

ORM oficial:

Prisma

---

# Logs

Toda exceção deverá ser tratada.

Não utilizar console.log para logs de produção.

---

# Testes

Cada módulo deverá possuir testes unitários.

Testes de integração serão adicionados gradualmente.

---

# Documentação

Toda decisão arquitetural relevante deverá gerar um ADR.

Toda Sprint deverá possuir documentação técnica.

---

# Dependências

Nenhuma biblioteca poderá ser adicionada sem justificativa técnica documentada.

---

# Objetivo de Longo Prazo

O projeto deverá evoluir para uma arquitetura baseada em domínio (DDD) e Clean Architecture, mantendo simplicidade nas fases iniciais.
