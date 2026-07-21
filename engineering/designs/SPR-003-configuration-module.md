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

## Lições Aprendidas

Durante a validação foi identificada uma incompatibilidade entre Jest 30 e ts-jest 29.

Para este projeto foi padronizado:

- jest 29.7.x
- ts-jest 29.4.x
- @types/jest 29.5.x

Essa combinação é compatível com o NestJS 11 e evita problemas na resolução do transformer `ts-jest`.

