# SPR-004 — Persistence Foundation

## Objetivo

Revisar e consolidar a infraestrutura de persistência (`PrismaModule` /
`PrismaService`) do Content-OS, garantindo injeção de dependência correta,
lifecycle adequado do NestJS, conexão única, graceful shutdown, logging e
tratamento de erros de inicialização — sem implementar regras de negócio.

## Estado atual

Ao iniciar esta Sprint, a camada de persistência (herdada da SPR-002 e
ajustada na SPR-003) já contava com:

- `PrismaModule` (`@Global()`), provendo/exportando `PrismaService` como
  singleton único para toda a aplicação.
- `PrismaService` estendendo `PrismaClient` (Prisma 7), com o driver
  adapter `PrismaPg` recebendo a connection string via `AppConfigService`
  (não mais `process.env` direto, resolvido na SPR-003).
- `onModuleInit` chamando `$connect()` e `onModuleDestroy` chamando
  `$disconnect()`, sem logging e sem tratamento de erro.
- `main.ts` sem `app.enableShutdownHooks()`.
- Testes unitários cobrindo `AppConfigService` e `env.validation.ts`, mas
  nenhum teste para `PrismaService`.
- Um teste e2e (`test/app.e2e-spec.ts`) que **não rodava** (falhava na
  fase de resolução de módulos do Jest, antes mesmo de qualquer teste
  executar).

## Problemas encontrados

### 1. Graceful shutdown não habilitado (bug real, prioridade alta)

O NestJS só invoca `onModuleDestroy`/`onApplicationShutdown` em resposta a
sinais do processo (`SIGTERM`, `SIGINT`) se `app.enableShutdownHooks()`
for chamado explicitamente. Sem isso, um `docker stop`, redeploy ou
rolling update em Kubernetes mata o processo sem que o Nest feche a
conexão do Prisma de forma limpa — o pool de conexões é simplesmente
abandonado. Validado empiricamente: antes da correção, matar o processo
via `SIGTERM` não produzia nenhum log de desconexão; depois da correção,
o log `"Conexão com o banco de dados encerrada."` aparece de forma
confiável.

### 2. Ausência de logging e tratamento de erro no lifecycle

`onModuleInit`/`onModuleDestroy` não logavam nada e não tratavam falhas de
conexão/desconexão de forma explícita. Um erro em `$connect()` propagava
como uma exceção "crua" do driver, sem contexto, e nada era logado em
`$disconnect()`.

### 3. Zero cobertura de testes para `PrismaService`

Não havia nenhum teste unitário para o lifecycle da camada de persistência
(conexão, desconexão, tratamento de erro).

### 4. Suíte de testes (unitária e e2e) quebrada ao tocar Prisma

Esse foi o achado mais sério, pois bloqueia qualquer teste — presente ou
futuro — que importe `PrismaModule`/`AppModule` (unitário ou e2e):

- **Resolução de módulo:** o client gerado pelo Prisma 7 usa imports
  relativos com extensão `.js` (convenção exigida por
  `moduleResolution: "nodenext"` no `tsconfig.json`, ex.:
  `import * as $Class from "./internal/class.js"`, que na verdade aponta
  para `class.ts`). O `ts-jest`, sem configuração adicional, não sabe
  resolver esse `.js` para o `.ts` correspondente e falha com
  `Cannot find module './internal/class.js'` — isso acontecia mesmo antes
  de qualquer alteração desta Sprint, apenas nunca havia sido notado
  porque o e2e simplesmente não passava a essa fase.
- **WASM query compiler:** o motor de queries do Prisma 7 carrega um
  módulo WASM via `import()` dinâmico
  (`await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.js")`).
  Isso exige a flag `--experimental-vm-modules` do Node ao rodar sob Jest;
  sem ela, o teste falha com
  `TypeError: A dynamic import callback was invoked without --experimental-vm-modules`
  assim que `$connect()` é chamado de verdade (isto é, sem mock).

Ambos os problemas são pré-existentes à SPR-004 (introduzidos pela
combinação Prisma 7 + `nodenext` já adotada desde a SPR-002), mas como
bloqueavam toda e qualquer validação automatizada da camada de
persistência, corrigi-los foi tratado como parte desta Sprint — sem eles,
não seria possível nem testar unitariamente o próprio `PrismaService`
criado aqui.

## Alternativas consideradas

### Para o problema de graceful shutdown

- **Chamar `enableShutdownHooks()`** (escolhida): uma linha, nativa do
  Nest, documentada oficialmente para exatamente esse cenário.
- Implementar um handler manual de `process.on('SIGTERM', ...)` chamando
  `app.close()`: reinventa o que o Nest já oferece nativamente: mais
  código, mais superfície de erro, sem benefício adicional. Descartada.

### Para o tratamento de erro em `onModuleInit`/`onModuleDestroy`

- **`try/catch` local no próprio `PrismaService` com `Logger` do Nest**
  (escolhida): simples, direto, sem dependências novas, consistente com o
  padrão de fail-fast já adotado no `env.validation.ts` (SPR-003).
- Um filtro de exceção global (`ExceptionFilter`) dedicado a erros do
  Prisma: útil quando módulos de negócio começarem a lançar
  `PrismaClientKnownRequestError` em runtime (ex.: violação de
  constraint), mas irrelevante para erros de *lifecycle* (conectar/
  desconectar), que são o escopo desta Sprint. Registrado como melhoria
  futura (ver seção correspondente).

### Para os bugs de teste

- **`moduleNameMapper` no Jest + flag `--experimental-vm-modules`**
  (escolhida): resolve exatamente as duas causas raiz identificadas, sem
  introduzir novas dependências, sem trocar de test runner.
- Trocar `ts-jest` por outro executor (ex.: Vitest): resolveria os
  problemas de ESM de forma mais nativa, mas é uma mudança de ferramenta
  de build que a ADR-001 não cobre e que exigiria seu próprio ADR — fora
  do escopo e do princípio de não alterar stack sem justificativa
  explícita. Descartada para esta Sprint; registrada como melhoria futura
  a avaliar, não decidida.

## Arquitetura proposta

Sem mudanças estruturais em `PrismaModule`/`PrismaService` além do já
descrito — a arquitetura definida na SPR-002/SPR-003 (Prisma isolado num
módulo `@Global()`, configuração via `AppConfigService`) já estava
correta. O trabalho desta Sprint é de **hardening** do que já existe:
lifecycle robusto, observabilidade mínima (logs) e testabilidade — não
uma nova abstração.

Nenhuma abstração nova (ex.: `PrismaRepository` genérico, interfaces de
repositório) foi introduzida — não há regra de negócio ainda que a
justifique (YAGNI).

## Decisões tomadas

1. `app.enableShutdownHooks()` adicionado em `main.ts`, logo após a
   criação da aplicação.
2. `PrismaService` ganhou um `Logger` privado; `onModuleInit` loga sucesso
   e, em caso de falha, loga com stack trace e relança o erro (fail-fast:
   a aplicação não deve subir se não conseguir logicamente reportar
   problema ao conectar); `onModuleDestroy` loga sucesso e, em caso de
   falha, loga o erro **sem relançar** (a aplicação já está em processo
   de encerramento; abortar o shutdown por causa disso não traria
   benefício).
3. Comentário adicionado a `PrismaModule` explicitando a garantia de
   conexão única (decorre de `@Global()` + escopo singleton padrão do
   Nest — nada de novo foi implementado, apenas documentado).
4. Testes unitários novos para `PrismaService` (`prisma.service.spec.ts`),
   cobrindo conexão, desconexão e os dois caminhos de erro, com
   `$connect`/`$disconnect` mockados via `jest.spyOn` — não dependem de um
   Postgres real.
5. Corrigida a configuração do Jest (unitário e e2e) com
   `moduleNameMapper` para resolver os imports `.js` do client gerado.
6. Corrigido o script `test:e2e` para rodar com
   `node --experimental-vm-modules` (necessário para o motor WASM do
   Prisma 7). Escolhida a forma de invocar `node` diretamente com a flag
   (em vez de `NODE_OPTIONS=...`) por ser multiplataforma sem exigir uma
   dependência nova como `cross-env` — a equipe usa Windows (PowerShell) e
   Linux/Mac.

## Riscos

- **O `try/catch` em `onModuleInit` não é uma rede de segurança completa
  contra indisponibilidade do banco.** Validado empiricamente: mesmo com
  uma `DATABASE_URL` sintaticamente inválida (`nao-e-uma-url-valida`), a
  aplicação subiu normalmente e logou "Conexão com o banco de dados
  estabelecida." — o adapter `PrismaPg`/Prisma 7 não valida nem conecta
  de forma eager em `$connect()`; a conexão real só é estabelecida (e só
  então um erro apareceria) na primeira query efetiva. Ou seja: o
  fail-fast de conectividade real com o banco **não existe hoje** — só o
  fail-fast de variáveis de ambiente ausentes/malformadas (SPR-003)
  funciona de forma imediata. Isso deve ficar claro para quem for
  depurar um "deploy que sobe mas não funciona": o log de sucesso do
  Prisma não garante que o banco está de fato acessível.
- **`--experimental-vm-modules` é, por definição, uma feature
  experimental do Node.** É a solução recomendada oficialmente pela
  documentação do Prisma para rodar client 7.x sob Jest hoje; caso versões
  futuras do Node/Jest tragam suporte nativo estável a ESM que dispense a
  flag, o script `test:e2e` deve ser revisto.

## Exceções

- `prisma.config.ts` continua sendo a única exceção documentada ao
  critério "nenhum `process.env` fora do módulo de configuração"
  (decisão da SPR-003, mantida): é lido pela CLI do Prisma, fora do
  bootstrap do Nest, sem container de DI disponível.

## Impacto nas próximas Sprints

- Qualquer módulo de negócio que precisar do banco (Release 0.2 em
  diante) já pode injetar `PrismaService` normalmente — DI, conexão
  única, shutdown e logging básico já estão resolvidos.
- A suíte de e2e agora funciona de verdade: novos testes e2e de módulos
  futuros (usuários, autenticação, etc.) podem ser escritos com confiança
  de que a infraestrutura de teste (Jest + Prisma 7) já está corrigida.
- O risco documentado sobre fail-fast de conectividade é relevante para
  quando health checks forem implementados (ver melhorias futuras): um
  health check que efetivamente execute uma query (`SELECT 1`) contra o
  banco será a única forma real de detectar indisponibilidade — o
  lifecycle do Prisma sozinho não detecta isso.

## Melhorias futuras (documentadas, não implementadas)

Fora do escopo desta Sprint, registradas para avaliação em Sprints
futuras, conforme instrução explícita de não antecipar funcionalidades:

1. **Health check de banco de dados** (`@nestjs/terminus` + `PrismaService`
   executando um `SELECT 1`), para detectar indisponibilidade real do
   banco — dado o risco documentado acima, hoje nada detecta isso de
   forma proativa. Faria sentido junto de uma Sprint de observabilidade,
   possivelmente na Release 0.3 (Auditoria/Logs).
2. **Filtro de exceção global para erros do Prisma**
   (`PrismaClientKnownRequestError` etc.), mapeando erros de constraint/
   FK para respostas HTTP consistentes. Só faz sentido quando módulos de
   negócio começarem a escrever no banco (Release 0.2 em diante) — hoje
   não há nenhuma regra de negócio usando o Prisma.
3. **Validação mais estrita de `DATABASE_URL`** em `env.validation.ts`
   (ex.: exigir prefixo `postgresql://`/`postgres://`). Não implementado
   agora por ser incremental e de baixo risco isolado, mas vale revisão
   quando outras variáveis de conexão (host/porta/usuário) forem
   introduzidas de fato — não antes, para não antecipar estrutura sem uso
   real (lição já aplicada nesta Sprint na revisão de `configuration.ts`
   feita após o retorno do Tech Lead na SPR-003).
4. **Avaliar troca de `ts-jest` por um executor com suporte nativo a ESM**
   (ex.: Vitest), o que eliminaria a necessidade da flag experimental do
   Node. Mudança de ferramenta de build, exigiria seu próprio ADR — não
   decidida, apenas registrada como possibilidade.
