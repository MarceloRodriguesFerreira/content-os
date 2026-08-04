# ADR-005 — API Versioning Strategy

## Status

Accepted

## Context

Até a SPR-007, a API não possui nenhum esquema de versionamento — todas as rotas vivem na raiz
(`/health`, `/auth/login`, `/users/me`). A SPR-008 planejou originalmente introduzir a
padronização de respostas (`TransformInterceptor`/`AllExceptionsFilter`, Bloco B) e o
versionamento de API (Bloco C) de forma que o envelope só existisse a partir de `/v1` — evitando
uma janela em que o formato de resposta mudasse sem uma versão explícita associada.

**Nota de atualização (pós-merge do Bloco B):** na execução real da sprint, o Bloco B foi
implementado, revisado e mergeado (`677d676`) **antes** deste Bloco C. Isso significa que o
envelope de resposta (`ADR-007`) já está em produção sobre rotas **sem** versão há um período,
antes de existir qualquer `/v1`. A intenção original (envelope nascer junto com a versão) não se
concretizou na prática — o histórico do repositório reflete isso e não será reescrito. Esta ADR
é atualizada, não substituída, porque a decisão em si (URI Versioning, `/v1`, `/health` neutro)
permanece correta; apenas a premissa de sequenciamento na seção "Compatibilidade e impactos"
estava desatualizada e é corrigida abaixo.

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
- `GET /` (rota raiz, `AppController`) é **removida** — ver seção "Avaliação de `GET /`" abaixo.

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

- **Breaking change consciente, em dois passos (não um só, como planejado originalmente):** o
  primeiro passo já aconteceu no Bloco B — o envelope de resposta (`ADR-007`) entrou em produção
  sobre rotas sem versão. Este Bloco C é o segundo passo: as mesmas rotas (`/auth/login`,
  `/auth/refresh`, `/auth/logout`, `/users/me`) migram para `/v1/...`, mantendo o envelope já
  existente — não há mudança de formato de corpo neste bloco, só de path. Como o produto ainda
  não tem consumidores externos publicados, os dois passos, mesmo não tendo sido simultâneos como
  o plano original previa, não geram nenhum período real de suporte a contrato duplicado: não há
  ninguém integrado ao formato intermediário (sem versão, com envelope) que precise de transição.
- Testes E2E existentes (`app.e2e-spec.ts`, `auth.e2e-spec.ts`) precisam ser atualizados para os
  novos paths — tratado como parte da entrega desta sprint, não como débito.
- `README.md` e `PROJECT_STATUS.md` devem refletir os novos paths assim que o versionamento for
  implementado (Bloco C).
- **Risco de testabilidade identificado na revisão pré-Bloco C:** ao contrário de
  `ValidationPipe`/`AllExceptionsFilter`/`TransformInterceptor` (Bloco B), que foram registrados
  via token de DI (`APP_PIPE`/`APP_FILTER`/`APP_INTERCEPTOR`) especificamente para que testes E2E
  (que sobem a aplicação a partir de `AppModule` puro) tivessem o mesmo comportamento de produção
  sem duplicação manual, `app.enableVersioning()` **não tem equivalente via token de DI** — é uma
  chamada imperativa na instância `NestApplication`, disponível apenas onde a aplicação é
  bootstrapada (`main.ts` em produção; `beforeAll` nos testes E2E). Para não reintroduzir a
  duplicação que o Bloco B eliminou, a configuração de bootstrap (`enableVersioning` e qualquer
  configuração futura equivalente) é extraída para uma função compartilhada (`configureApp()`),
  chamada tanto por `main.ts` quanto pelos testes E2E — ver `SPR-008-bloco-c-platform.md`.
- **Ordem de bootstrap obrigatória:** `enableVersioning()` deve ser chamado **antes** de
  `setupSwagger()` — o Swagger só reflete os paths `/v1/...` corretamente se o versionamento já
  estiver habilitado na aplicação no momento em que o documento OpenAPI é gerado. `configureApp()`
  garante essa ordem em um único lugar, em vez de depender de disciplina manual em cada ponto de
  bootstrap.

## Avaliação de `/health`

`/health` permanece **fora do versionamento** (path `/health`, não `/v1/health`).

Justificativa: health checks são consumidos por infraestrutura (orquestradores, load balancers,
monitoramento), não por clientes de negócio — atrelar `/health` a uma versão de API obrigaria
qualquer configuração de infraestrutura a ser atualizada a cada nova versão de API, o que não
tem relação com o propósito do endpoint (disponibilidade do processo, não contrato de negócio).
Esta é a mesma convenção adotada por padrão pelo próprio NestJS (rotas podem ser explicitamente
excluídas do versionamento) e é amplamente usada no ecossistema (ex.: Kubernetes liveness/readiness
probes esperam paths estáveis e não-versionados).

## Avaliação de `GET /`

`GET /` (rota raiz, `AppController.getHello()`) é **removida** neste bloco, junto com
`AppController`/`AppService` inteiros — não é adaptada para o versionamento nem marcada como
neutra.

Justificativa: é um artefato do scaffold padrão do NestJS (`nest new`), sem função de negócio,
documentação ou consumidor conhecido — apenas retorna uma string estática. Mantê-la exigiria
decidir arbitrariamente se ela é uma rota "de negócio" (deveria ir para `/v1/`) ou "de
infraestrutura" (deveria ficar neutra, como `/health`) sem que nenhuma das duas categorias se
aplique de fato. Removê-la é consistente com o princípio de YAGNI já aplicado em outras decisões
do projeto (ex.: `ADR-004`, `configuration.ts`): não existe necessidade real justificando mantê-la
versionada, neutra, ou de qualquer outra forma.

O teste E2E que hoje valida `/ (GET)` (`app.e2e-spec.ts`) é removido junto — o guard global
(`JwtAuthGuard`, ADR-002) continua coberto pelos testes que já protegem `/v1/users/me` e pela
ausência de `@Public()` em qualquer rota de negócio nova.

## Consequences

- Toda rota de negócio nova nasce sob `/v1` por padrão (versão definida via `defaultVersion`).
- `/health` precisa ser explicitamente excluído do versionamento no bootstrap (`VERSION_NEUTRAL`),
  com esta ADR como referência do motivo.
- `AppController`/`AppService` e a rota `GET /` são removidos do repositório.
- A configuração de bootstrap da aplicação (`enableVersioning`, na ordem correta em relação ao
  Swagger) vive em uma função compartilhada `configureApp()`, usada por `main.ts` e pelos testes
  E2E — não duplicada manualmente em cada ponto de bootstrap.
- Introduzir `v2` no futuro é aditivo (não exige nova ADR, apenas segue a estratégia já descrita
  aqui) — só uma mudança na estratégia em si (ex.: trocar para versionamento por header) exigiria
  substituir esta ADR.
