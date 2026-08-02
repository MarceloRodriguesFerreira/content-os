# ADR-005 — API Versioning Strategy

## Status

Accepted

## Context

Até a SPR-007, a API não possui nenhum esquema de versionamento — todas as rotas vivem na raiz
(`/health`, `/auth/login`, `/users/me`). A SPR-008 introduz mudanças de contrato relevantes
(padronização de respostas via `TransformInterceptor`/`ExceptionFilter`, Bloco B) que afetarão o
formato de resposta de toda a API. Antes de introduzir essa mudança de contrato, é necessário
decidir como o projeto versiona sua API — para que o formato padronizado nasça já sob uma versão
explícita (`v1`), em vez de ser uma alteração silenciosa de rotas sem versão.

Por se tratar de uma decisão estrutural que afeta o path de toda rota existente e futura, e que
é cara de reverter depois que clientes (frontend, integrações) passarem a depender de um formato
de path específico, esta decisão é formalizada como ADR.

## Decision

- Adotar o **URI Versioning nativo do NestJS** (`app.enableVersioning({ type: VersioningType.URI,
  defaultVersion: '1' })`).
- Toda rota de negócio passa a viver sob `/v1` (ex.: `/v1/auth/login`, `/v1/users/me`).
- A documentação interativa (Swagger UI, `/api/docs`) **não** é afetada pelo versionamento de
  rotas de negócio — continua em path fixo, por ser infraestrutura de documentação, não uma rota
  de domínio.
- `/health` é avaliado separadamente (ver seção "Avaliação de `/health`" abaixo).

## Estratégia para futuras versões

- Uma nova versão (`v2`) só deve ser criada quando houver uma mudança de contrato
  **incompatível** com `v1` (ex.: remoção de campo, mudança de tipo, mudança de semântica) —
  não para toda mudança aditiva (campos novos opcionais não exigem nova versão).
- Controllers versionados usam a opção `version` do decorator `@Controller()` do NestJS
  (suporte nativo a múltiplas versões coexistindo no mesmo processo), evitando duplicação de
  módulos inteiros para manter uma versão antiga viva.
- Não há compromisso de suporte a versões antigas por um prazo fixo nesta ADR — cada
  descontinuação de versão deve ser tratada com uma entrada própria no `CHANGELOG.md` sob
  "Deprecated"/"Removed", com prazo de aviso definido no momento, já que o produto ainda não tem
  consumidores externos.

## Compatibilidade e impactos

- **Breaking change consciente:** como o formato de resposta padronizado (Bloco B) só passa a
  existir a partir de `v1`, não há uma "v0" cujo contrato precise ser preservado — os endpoints
  da SPR-007 (`/auth/login`, `/auth/refresh`, `/users/me`) migram diretamente para `/v1/...` já
  com o novo formato de resposta, sem período de coexistência de dois contratos.
- Testes E2E existentes (`app.e2e-spec.ts`, `auth.e2e-spec.ts`) precisam ser atualizados para os
  novos paths — tratado como parte da entrega desta sprint, não como débito.
- `README.md` e `PROJECT_STATUS.md` devem refletir os novos paths assim que o versionamento for
  implementado (Bloco C).

## Avaliação de `/health`

`/health` permanece **fora do versionamento** (path `/health`, não `/v1/health`).

Justificativa: health checks são consumidos por infraestrutura (orquestradores, load balancers,
monitoramento), não por clientes de negócio — atrelar `/health` a uma versão de API obrigaria
qualquer configuração de infraestrutura a ser atualizada a cada nova versão de API, o que não
tem relação com o propósito do endpoint (disponibilidade do processo, não contrato de negócio).
Esta é a mesma convenção adotada por padrão pelo próprio NestJS (rotas podem ser explicitamente
excluídas do versionamento) e é amplamente usada no ecossistema (ex.: Kubernetes liveness/readiness
probes esperam paths estáveis e não-versionados).

## Consequences

- Toda rota de negócio nova nasce sob `/v1` por padrão (versão definida via `defaultVersion`).
- `/health` precisa ser explicitamente excluído do versionamento no bootstrap, com esta ADR como
  referência do motivo.
- Introduzir `v2` no futuro é aditivo (não exige nova ADR, apenas segue a estratégia já descrita
  aqui) — só uma mudança na estratégia em si (ex.: trocar para versionamento por header) exigiria
  substituir esta ADR.
