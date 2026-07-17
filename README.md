# Content-OS

Content-OS é uma plataforma SaaS para planejamento, organização e criação de conteúdo para redes sociais utilizando Inteligência Artificial.

O objetivo do projeto é ajudar pequenos empreendedores, criadores de conteúdo e pequenas empresas a manter uma presença digital organizada, consistente e estratégica.

---

# Principais Funcionalidades

- Organização de ideias.
- Calendário editorial.
- Biblioteca de conteúdos.
- Geração de legendas com IA.
- Sugestão de hashtags.
- Planejamento de campanhas.
- Organização de publicações.
- Dashboard de produtividade.

---

# Tecnologias

## Frontend

- Next.js
- React
- TypeScript

## Backend

- NestJS
- Prisma
- PostgreSQL

## Infraestrutura

- Docker
- Turborepo
- pnpm Workspace

---

# Estrutura do Projeto

```
apps/
    api/
    web/

packages/

docker/

engineering/
```

---

# Objetivo do Projeto

O Content-OS não pretende ser apenas mais uma ferramenta de geração de textos com Inteligência Artificial.

Sua proposta é organizar todo o ciclo de produção de conteúdo, permitindo que o usuário tenha um processo estruturado para planejar, criar, revisar e acompanhar suas publicações.

A Inteligência Artificial atua como um assistente dentro desse fluxo, auxiliando nas tarefas criativas sem substituir a estratégia do usuário.

---

# Público-alvo

- Pequenos empreendedores
- Artesãos
- Ateliês
- Lojas virtuais
- Prestadores de serviço
- Criadores de conteúdo
- Pequenas empresas

---

# Estado Atual

O projeto encontra-se em desenvolvimento ativo.

A infraestrutura principal já foi estabelecida e novas funcionalidades serão implementadas de forma incremental, seguindo o roadmap disponível em `engineering/roadmap.md`.

---

# Documentação

Toda a documentação técnica está centralizada na pasta `engineering`.

Ela inclui:

- Arquitetura
- Roadmap
- ADRs
- Padrões
- Checklists
- Runbooks
- Design Documents

---

# Licença

Em definição.

-----------------------------------------
# Content OS

## O que é?

(Content OS será descrito aqui.)

## Tecnologias

- Next.js
- NestJS
- PostgreSQL
- Prisma
- Turborepo

## Estrutura

apps/
packages/
engineering/
docs/

## Como executar

(em construção)

# Content-OS

> **Sistema Operacional para Gestão de Conteúdo com Inteligência Artificial**

Content-OS é uma plataforma SaaS desenvolvida para ajudar pequenos negócios, criadores de conteúdo e profissionais autônomos a planejar, organizar, produzir e gerenciar conteúdos para redes sociais de forma simples, rápida e inteligente.

O objetivo não é apenas gerar legendas com IA, mas organizar todo o ciclo de vida do conteúdo, desde a captura da ideia até a análise dos resultados.

---

# Nossa Missão

Transformar a produção de conteúdo em um processo organizado, produtivo e assistido por Inteligência Artificial, permitindo que qualquer pessoa mantenha uma presença digital consistente sem precisar ser especialista em marketing.

---

# O Problema

Hoje, a maioria dos pequenos empreendedores cria seus conteúdos diretamente pelo aplicativo do Instagram.

Esse processo normalmente é lento e desorganizado.

Algumas dificuldades comuns:

- Não saber o que publicar.
- Perder boas ideias.
- Escrever a legenda diversas vezes.
- Procurar hashtags manualmente.
- Repetir tarefas todos os dias.
- Não possuir um calendário editorial.
- Não conseguir reaproveitar conteúdos antigos.
- Dificuldade em manter frequência nas publicações.

Além disso, o aplicativo do Instagram foi desenvolvido para publicar conteúdo, e não para organizá-lo.

---

# Nossa Solução

O Content-OS funciona como um **Sistema Operacional para Conteúdo**.

Ele organiza todas as etapas da criação:

- Captura de ideias
- Organização por campanhas
- Biblioteca de conteúdos
- Biblioteca de imagens
- Planejamento editorial
- Geração de conteúdo com IA
- Revisão
- Aprovação
- Publicação
- Histórico
- Reaproveitamento
- Analytics

A Inteligência Artificial atua como um assistente durante todo esse processo, aumentando produtividade sem retirar o controle do usuário.

---

# Nosso Principal Objetivo

Criar conteúdo deve ser **mais rápido e mais fácil do que utilizar diretamente o aplicativo do Instagram**.

Essa é a principal diretriz do Content-OS.

Toda funcionalidade implementada deverá contribuir para esse objetivo.

---

# Público-Alvo

O Content-OS foi pensado para atender:

- Pequenos empreendedores
- Artesãos
- Ateliês
- Lojas virtuais
- Prestadores de serviços
- Profissionais liberais
- Pequenas empresas
- Criadores de conteúdo

O primeiro ambiente de validação será um ateliê de enxovais para bebês, permitindo validar funcionalidades em um cenário real antes da expansão para outros segmentos.

---

# Funcionalidades Planejadas

## Organização

- Banco de Ideias
- Calendário Editorial
- Biblioteca de Conteúdo
- Biblioteca de Imagens
- Organização por campanhas
- Categorias
- Etiquetas

## Inteligência Artificial

- Geração de legendas
- Sugestão de hashtags
- Sugestão de CTA
- Sugestão de emojis
- Ideias de conteúdo
- Planejamento semanal
- Planejamento mensal
- Melhorias automáticas de textos

## Gestão

- Fluxo de aprovação
- Histórico de alterações
- Publicações agendadas
- Dashboard
- Analytics
- Métricas

---

# Princípios do Produto

Todo desenvolvimento deve seguir estes princípios:

- Tornar a criação de conteúdo mais simples.
- Reduzir o tempo gasto pelo usuário.
- Organizar antes de automatizar.
- A IA deve auxiliar, nunca controlar.
- Evitar retrabalho.
- Incentivar reutilização de conteúdo.
- Interface intuitiva.
- Foco em produtividade.

---

# Tecnologias

## Backend

- NestJS
- Prisma ORM
- PostgreSQL

## Frontend

- Next.js
- React
- TypeScript

## Infraestrutura

- Docker
- Docker Compose
- Turborepo
- pnpm Workspace

---

# Arquitetura

```
                +----------------+
                |     Web App    |
                +--------+-------+
                         |
                         |
                  REST API
                         |
                +--------v-------+
                |     NestJS     |
                +--------+-------+
                         |
                    Prisma ORM
                         |
                +--------v-------+
                | PostgreSQL 16  |
                +----------------+
```

---

# Estrutura do Projeto

```
content-os/

├── apps/
│   ├── api/
│   └── web/
│
├── packages/
│
├── docker/
│
├── engineering/
│   ├── adr/
│   ├── checklists/
│   ├── designs/
│   ├── runbooks/
│   └── standards/
│
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

---

# Roadmap

O planejamento do projeto encontra-se em:

- `engineering/roadmap.md`
- `PROJECT_STATUS.md`

---

# Documentação

Toda documentação técnica está centralizada na pasta:

```
engineering/
```

Documentos principais:

- architecture.md
- product.md
- roadmap.md
- ADRs
- Runbooks
- Standards
- Design Documents
- Checklists

---

# Pré-requisitos

Antes de iniciar o projeto, instale:

- Node.js 24+
- pnpm
- Docker Desktop
- Git

---

# Instalação

Clone o projeto:

```bash
git clone https://github.com/MarceloRodriguesFerreira/content-os.git

cd content-os
```

Instale as dependências:

```bash
pnpm install
```

Suba o banco de dados:

```bash
cd docker

docker compose up -d
```

Retorne para a raiz:

```bash
cd ..
```

Execute as migrations:

```bash
pnpm --filter api exec prisma migrate dev
```

Inicie o ambiente:

```bash
pnpm dev
```

---

# Scripts

## Executar tudo

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Lint

```bash
pnpm lint
```

## Formatação

```bash
pnpm format
```

## Type Check

```bash
pnpm check-types
```

---

# Prisma

Gerar o Client:

```bash
pnpm --filter api exec prisma generate
```

Criar uma migration:

```bash
pnpm --filter api exec prisma migrate dev --name nome-da-migration
```

Abrir Prisma Studio:

```bash
pnpm --filter api exec prisma studio
```

---

# Docker

Subir containers:

```bash
cd docker

docker compose up -d
```

Parar containers:

```bash
docker compose down
```

Ver logs:

```bash
docker compose logs -f
```

---

# Turborepo

Este projeto utiliza Turborepo para gerenciamento do monorepo.

## Build

```bash
pnpm build
```

## Desenvolvimento

```bash
pnpm dev
```

## Build de um projeto específico

```bash
pnpm turbo build --filter=api
```

ou

```bash
pnpm turbo build --filter=web
```

## Executar apenas a API

```bash
pnpm --filter api start:dev
```

## Executar apenas o Frontend

```bash
pnpm --filter web dev
```

---

# Organização do Desenvolvimento

O projeto segue uma abordagem baseada em Sprints.

Cada Sprint possui:

- Documento de Design
- Checklist
- Critérios de aceite
- Status

As decisões arquiteturais são registradas como ADRs.

---

# Como Contribuir

1. Crie uma branch:

```
feature/nome-da-feature
```

2. Desenvolva.

3. Execute os testes.

4. Faça commit seguindo Conventional Commits.

5. Abra um Pull Request.

---

# Convenção de Commits

Exemplos:

```
feat(auth): add login endpoint

fix(prisma): adjust datasource configuration

docs(readme): update installation guide

refactor(api): improve configuration module
```

---

# Estado Atual

O projeto encontra-se em desenvolvimento ativo.

A infraestrutura principal está sendo construída de forma incremental, seguindo as sprints definidas na documentação.

---

# Licença

Em definição.

---

**Content-OS**

*"Organize. Crie. Evolua."*

