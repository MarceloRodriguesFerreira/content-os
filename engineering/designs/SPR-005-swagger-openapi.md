# SPR-005 — Documentação da API (Swagger/OpenAPI)

## Objetivo

Estabelecer a infraestrutura oficial de documentação da API via Swagger/OpenAPI 3,
servindo como padrão único a ser seguido por todos os módulos futuros — sem
implementar nenhuma funcionalidade de negócio.

## Estado atual

`ARCHITECTURE.md` já listava "Swagger obrigatório" como convenção adotada e
`VISION.md`/`PROJECT_STATUS.md` já previam a Release 0.3 como "Swagger", mas
nenhuma configuração existia de fato — `@nestjs/swagger` não estava instalado.

## Decisão

- `@nestjs/swagger` (`^11.4.6`, compatível com `@nestjs/common`/`@nestjs/core`
  `^11.0.1` já usados no projeto).
- Configuração isolada em `src/swagger.config.ts` (função `setupSwagger(app)`),
  fora de `main.ts` e fora de `src/config/` — essa última pasta é dedicada
  exclusivamente ao `AppConfigModule`/`AppConfigService` (configuração de
  variáveis de ambiente), então misturar a configuração do Swagger ali
  diluiria essa fronteira já estabelecida na SPR-003.
- Documentação disponível em `/api/docs` (UI) e `/api/docs-json` (spec OpenAPI
  crua), conforme especificado.
- Título "Content OS API", versão "1.0", descrição extraída do parágrafo de
  abertura do `VISION.md`.
- Organização por tags (`@ApiTags`) — uma tag por controller (`App`, `Health`),
  preparando o padrão para os módulos de negócio que virão a seguir.
- `HealthController`/`HealthService` documentados por completo: `@ApiOperation`,
  `@ApiResponse` com schema tipado, e um DTO de resposta
  (`HealthResponseDto`) com `@ApiProperty` (description + example) em cada
  campo — primeiro exemplo concreto de "DTO documentado" a ser seguido pelos
  módulos futuros.
- `AppController` (endpoint raiz, herdado do boilerplate) recebeu apenas tag e
  `@ApiOperation` mínimos, para não aparecer sem categoria na UI — sem criar
  DTO para um retorno de string simples (evita over-engineering de um
  endpoint que não é regra de negócio real).

## Fora do escopo (intencionalmente não implementado)

- **`ValidationPipe` global**: `ARCHITECTURE.md` já lista essa convenção, mas
  ela não está implementada no código hoje. Constatado durante a validação
  inicial desta Sprint, mas é uma preocupação independente do Swagger em si
  (validação de request vs. documentação de schema) — registrado como
  inconsistência a resolver em Sprint própria, não implementado aqui para não
  extrapolar o escopo definido.
- Autenticação/segurança no Swagger (`@ApiBearerAuth`, esquemas de segurança):
  não há autenticação implementada ainda (prevista para Release 0.4) — não
  há o que documentar agora.
- Correção do valor hardcoded de `service`/`version` em `HealthService`
  (poderia vir de `AppConfigService.appName`/`appVersion`): já sinalizado em
  checkpoint anterior como melhoria cosmética não relacionada ao objetivo
  desta Sprint. Mantido como estava.

## Ajuste incidental necessário

Ao instalar `@nestjs/swagger`, sua dependência transitiva `swagger-ui-dist`
trouxe `@scarf/scarf` (pacote de telemetria) para o lockfile. O
`pnpm-workspace.yaml` já tinha uma seção `allowBuilds` prevendo esse cenário,
mas com um placeholder não resolvido (`'@scarf/scarf': set this to true or
false`), o que fazia `pnpm install`/`pnpm lint` falharem com exit code 1.
Resolvido definindo `'@scarf/scarf': false` — nega a execução do script de
telemetria (sem necessidade funcional para o projeto), sem impedir o uso da
biblioteca em si (`swagger-ui-dist` funciona normalmente sem seu script de
post-install).

## Impacto nas próximas Sprints

- Todo módulo de negócio novo (Release 0.4 em diante) deve seguir o mesmo
  padrão: `@ApiTags` no controller, `@ApiOperation`/`@ApiResponse` em cada
  rota, DTOs de request/response com `@ApiProperty`.
- Quando a autenticação (JWT) for implementada, `setupSwagger` em
  `src/swagger.config.ts` é o único lugar que precisa ganhar
  `.addBearerAuth()` no `DocumentBuilder`.

## Melhorias futuras (documentadas, não implementadas)

1. Implementar `ValidationPipe` global (`main.ts`), resolvendo a divergência
   já existente entre `ARCHITECTURE.md` e o código.
2. Adaptar `HealthService` para usar `AppConfigService.appName`/`appVersion`
   em vez de valores hardcoded.
3. Health check real de banco de dados (já registrado como melhoria futura
   na SPR-004) poderia ganhar documentação Swagger própria quando implementado.

## Refinamento documental (decisão do Arquiteto do Content-OS)

Após revisão, o Arquiteto do projeto aprovou código, arquitetura e
organização sem ressalvas, e solicitou um ajuste apenas de nomenclatura de
versionamento, sem qualquer alteração de código:

- **Versão do projeto mantida em `0.2.0`** (sem bump de versão). Justificativa: o
  Swagger é infraestrutura de documentação, não uma funcionalidade real de
  produto. Na leitura arquitetural adotada para o projeto, a SPR-005
  permanece dentro da **Release 0.2** — a Release 0.3 só se inicia quando
  existir a primeira funcionalidade de negócio entregue. As entregas da
  SPR-005 foram fundidas na entrada `[0.2.0]` já existente do
  `CHANGELOG.md`, em vez de abrir uma versão nova.
- **"Release 0.3" renomeado para "Marco Técnico — SPR-005 concluída"** em
  `PROJECT_STATUS.md`, tanto na seção "Último Marco" quanto em "Próximo
  Marco", para não sugerir uma release de produto onde há apenas entrega de
  infraestrutura.
- **Próxima sprint explicitada como SPR-006 — Segurança (JWT)**, encerrando
  formalmente o ciclo da SPR-005 e abrindo o planejamento da próxima.

Nenhuma linha de código foi alterada por este refinamento — apenas
`PROJECT_STATUS.md`, `CHANGELOG.md` e este próprio design doc.
