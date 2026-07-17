# SPR-003 — Configuration Module

## Objetivo

Centralizar toda a configuração da aplicação em um único módulo.

## Motivação

Evitar acesso direto ao process.env em qualquer componente da aplicação.

## Componentes

- ConfigModule
- ConfigService
- configuration.ts
- env.validation.ts

## Critérios de aceite

- Nenhum process.env fora do módulo de configuração.
- Variáveis obrigatórias validadas.
- Configuração tipada.
- Prisma utilizando ConfigService.

## Fora do escopo

    - JWT
    - Redis
    - RabbitMQ
    - Cache
