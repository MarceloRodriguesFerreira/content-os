# Architecture

# Content-OS

Versão: 1.0

Status: Ativo

Última atualização: Julho/2026

---

# Objetivo

Este documento descreve a arquitetura conceitual do Content-OS.

Seu objetivo é servir como referência para decisões arquiteturais e garantir que a evolução do sistema mantenha uma estrutura consistente ao longo do tempo.

Este documento **não descreve detalhes de implementação**, mas sim a organização do produto em domínios de negócio e a relação entre eles.

---

# Princípios Arquiteturais

Toda decisão técnica deverá respeitar os seguintes princípios:

- Alta coesão.
- Baixo acoplamento.
- Simplicidade.
- Escalabilidade.
- Reutilização.
- Modularização.
- Evolução incremental.

Sempre que possível, novos recursos deverão ser adicionados como novos módulos, evitando alterações em módulos existentes.

---

# Visão Geral

O Content-OS é dividido em domínios independentes.

Cada domínio representa uma responsabilidade de negócio claramente definida.

```
                           +----------------------+
                           |      Frontend        |
                           |      Next.js         |
                           +----------+-----------+
                                      |
                                      |
                               REST / HTTPS
                                      |
                          +-----------v-----------+
                          |       NestJS API      |
                          +-----------+-----------+
                                      |
                     +----------------+----------------+
                     |                                 |
              Application Layer                 Infrastructure
                     |                                 |
             Business Domains                  Prisma / PostgreSQL
```

---

# Arquitetura em Camadas

```
Presentation

↓

Application

↓

Domain

↓

Infrastructure

↓

Database
```

Cada camada possui responsabilidades específicas.

---

# Domínios do Produto

O sistema será organizado pelos seguintes domínios.

```
Content-OS

├── Workspace
├── Authentication
├── Brand Hub
├── Content Hub
├── AI Studio
├── Editorial
├── Media Library
├── Analytics
├── Integrations
└── Administration
```

Cada domínio deverá possuir baixo acoplamento com os demais.

---

# Workspace

Responsável pela organização da plataforma.

Responsabilidades:

- Empresas
- Usuários
- Equipes
- Permissões
- Workspaces

No futuro deverá suportar multiempresa (multi-tenant).

---

# Authentication

Responsável pela autenticação e autorização.

Responsabilidades:

- Login
- JWT
- Refresh Token
- Recuperação de senha
- Controle de acesso
- Perfis de usuário

---

# Brand Hub

Centraliza todas as informações da marca.

Responsabilidades:

- Nome da marca
- Logo
- Paleta de cores
- Tipografia
- Público-alvo
- Tom de voz
- Personas
- Objetivos da marca

A IA utilizará essas informações para personalizar as respostas.

---

# Content Hub

É o coração do sistema.

Responsável por organizar todo o conhecimento produzido.

Responsabilidades:

- Banco de ideias
- Biblioteca de conteúdo
- Campanhas
- Categorias
- Tags
- Templates
- Histórico

Nenhum conteúdo deverá ser descartado.

Todo conteúdo poderá ser reutilizado.

---

# AI Studio

Responsável pelos recursos de Inteligência Artificial.

Não gera apenas textos.

Participa de todo o fluxo criativo.

Funcionalidades previstas:

- Sugestão de ideias
- Geração de legendas
- Geração de hashtags
- CTA
- Emojis
- Calendário
- Melhorias automáticas
- Resumos
- Adaptação para outras redes sociais

O AI Studio nunca deverá substituir a organização do sistema.

Ele complementa os demais módulos.

---

# Editorial

Responsável pelo planejamento.

Funcionalidades:

- Calendário Editorial
- Agendamentos
- Fluxo de aprovação
- Publicações
- Status
- Planejamento semanal
- Planejamento mensal

---

# Media Library

Responsável pelos arquivos.

Exemplos:

- Fotos
- Vídeos
- Logos
- Ícones
- Artes
- Arquivos de campanha

Todos os conteúdos poderão referenciar arquivos da biblioteca.

---

# Analytics

Responsável pela análise dos resultados.

Métricas previstas:

- Engajamento
- Frequência
- Crescimento
- Conteúdos mais utilizados
- Conteúdos reutilizados
- Performance das campanhas

---

# Integrations

Centraliza integrações externas.

Exemplos futuros:

- Instagram
- Facebook
- Threads
- Pinterest
- TikTok
- LinkedIn
- Google Drive
- Dropbox
- OpenAI
- Anthropic
- Gemini

Nenhuma integração deverá impactar diretamente os domínios internos.

Sempre utilizar interfaces bem definidas.

---

# Administration

Responsável pelas configurações da plataforma.

Exemplos:

- Configurações gerais
- Auditoria
- Logs
- Configurações da IA
- Feature Flags
- Configurações de integração

---

# Relação entre os Domínios

```
Workspace
      │
      ├──────────────┐
      │              │
      ▼              ▼

Brand Hub      Authentication

      │
      ▼

Content Hub

      │
      ├─────────────┐
      │             │
      ▼             ▼

AI Studio     Media Library

      │             │
      └──────┬──────┘
             ▼

        Editorial

             │

             ▼

        Analytics

             │

             ▼

        Integrations
```

O **Content Hub** é o principal domínio do produto.

A maioria das funcionalidades gira em torno dele.

---

# Arquitetura da API

A API seguirá arquitetura modular do NestJS.

Cada domínio possuirá seu próprio módulo.

Exemplo:

```
modules/

workspace/

authentication/

brand/

content/

ai/

editorial/

analytics/

media/

integrations/

administration/
```

Cada módulo deverá possuir:

```
module.ts

controller.ts

service.ts

repository.ts

dto/

entities/

interfaces/

tests/
```

---

# Banco de Dados

Banco oficial:

```
PostgreSQL
```

Acesso aos dados:

```
NestJS

↓

Prisma ORM

↓

PostgreSQL
```

Nenhum módulo deverá acessar SQL diretamente, salvo exceções justificadas por uma ADR.

---

# Comunicação

Inicialmente:

```
REST API
```

No futuro poderão ser adicionados:

- Webhooks
- Filas
- Eventos
- WebSocket

Sem alterar a arquitetura principal.

---

# Inteligência Artificial

A IA será tratada como um serviço externo.

```
Application

↓

AI Provider Interface

↓

OpenAI

Anthropic

Gemini

Outros
```

O restante do sistema nunca deverá depender de um fornecedor específico.

A troca do modelo deverá ocorrer apenas na camada de infraestrutura.

---

# Estratégia de Crescimento

A arquitetura deverá permitir evolução incremental.

Ordem prevista:

Fase 1

- Workspace
- Authentication
- Content Hub

Fase 2

- Brand Hub
- Media Library

Fase 3

- AI Studio

Fase 4

- Editorial

Fase 5

- Analytics

Fase 6

- Integrações

Cada fase deverá entregar valor real ao usuário.

---

# Decisões Arquiteturais

Todas as decisões relevantes deverão ser registradas em:

```
engineering/adr/
```

Nenhuma decisão estrutural deverá existir apenas no código.

---

# Princípios de Desenvolvimento

Antes de implementar uma funcionalidade, responder:

- Em qual domínio ela pertence?
- Ela aumenta ou reduz acoplamento?
- Existe reutilização possível?
- Está respeitando responsabilidade única?
- O domínio continua simples?

Se houver dúvida, criar uma ADR antes da implementação.

---

# Visão de Longo Prazo

O Content-OS deverá evoluir para uma plataforma composta por módulos independentes, permitindo que novas funcionalidades sejam adicionadas sem comprometer a estabilidade do sistema.

A arquitetura deve favorecer manutenção, escalabilidade e evolução contínua, mantendo o foco principal do produto: **organizar todo o ciclo de vida do conteúdo com apoio de Inteligência Artificial**.

---

# Arquitetura em Uma Frase

> **O Content-OS é um sistema modular onde cada domínio possui uma responsabilidade clara, trabalhando em conjunto para transformar ideias em conteúdo organizado, reutilizável e inteligente.**

