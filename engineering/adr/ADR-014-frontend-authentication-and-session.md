# ADR-014 — Autenticação, Sessão e Autorização no Servidor do Frontend (Next.js)

## Status

**Status de arquivo: `Proposed`** — revisão 8, **integrada à `main`** pelo PR #33 (merge `e4f2aa5`) e reconciliada em 14/10/2026. A revisão 7 foi avaliada pelo
Arquiteto-Chefe e não foi aprovada como baseline (histórico). Os estados abaixo são **distintos e não são sinônimos**:

| # | Estado | Situação | Base |
|---|---|---|---|
| 1 | Decisões individuais aprovadas | **P1, P3, P5 e P12** — **[APROV]**. **P7, P8 e P9** confirmadas como **fora do escopo do Bloco A**. As demais permanecem **[PROP][PEND]** (ver "Estado das decisões") | Registro nas instruções do Arquiteto-Chefe de 14/10/2026 (reconciliação documental, §2.3). **Esse registro não está versionado no repositório** |
| 2 | Aprovação arquitetural da revisão 8 / baseline | **Não registrada — PENDENTE.** **Design Freeze não declarado** | Nenhuma evidência de aprovação do conjunto |
| 3 | Integração dos documentos na `main` | **Ocorreu** — PR #33, merge `e4f2aa5` | **[FATO-L]**, revalidado em 14/10/2026 |
| 4 | Autorização formal para implementar o Bloco A | **Não concedida — PENDENTE** de auditoria e de autorização explícita do Arquiteto-Chefe | — |
| 5 | Aprovação do resultado do Bloco A | Não aplicável: nenhum bloco foi iniciado | — |

A aprovação de uma decisão individual **não** aprova a ADR inteira; o merge na `main` **não** equivale a aprovação nem a autorização. **Nenhum bloco está
autorizado.** Nada aqui autoriza, por si, implementação, branch, commit, patch ou PR de código.

### Legenda de estados (usada em todo o pacote documental)

| Marca | Significado |
|---|---|
| **[FATO-L]** | fato **verificado por leitura** (a revisão 8 foi elaborada sobre `main` @ `3480229`; a reconciliação revalidou `origin/main` @ `e4f2aa5`; arquivos lidos, documentação instalada do `next@16.2.0`) |
| **[FATO-E]** | fato **verificado por execução** — somente os experimentos listados na seção "Evidências" (todos de revisões anteriores) |
| **[INFO]** | informação **fornecida pelo usuário/Arquiteto-Chefe, não verificada** |
| **[HIP-n]** | **hipótese** pendente de validação |
| **[PROP]** | **proposta técnica do Claude** — não é decisão |
| **[PEND]** | decisão **aguardando o Arquiteto-Chefe** |
| **[APROV]** | decisão **aprovada** pelo Arquiteto-Chefe — hoje: **P1, P3, P5 e P12** (ver "Estado das decisões") |
| **[BLQ-IMPL]** | condição **bloqueadora de implementação** (de um bloco) |
| **[BLQ-DEPL]** | condição **bloqueadora de implantação** |

Toda decisão desta ADR é **[PROP] + [PEND]**, **exceto P1, P3, P5 e P12, que são [APROV]** (a regra central de cada uma; o detalhamento de implementação que a acompanha segue como **[PROP]**).

### Rastreabilidade

- **Histórico (à época da revisão 8):** `ADR-014` e documentos da SPR-015 **não existiam em `main`** (`main` = `3480229`, 0 commits novos, clone sem
  alterações) **[FATO-L]**.
- **Integração na `main` [FATO-L, revalidado em 14/10/2026 por `git fetch origin`]:** o PR #33 (`docs/spr-015-revisao-8`) foi mesclado (merge `e4f2aa5`;
  commit de conteúdo `1bea4e0`, "docs(spr-015): add frontend foundation proposal"). Os três documentos estão em `origin/main`.
- A revisão 2 foi uma reescrita integral de uma versão anterior que nunca esteve disponível; as revisões 3 a 8 derivam do texto da
  revisão anterior e das objeções do Arquiteto-Chefe. **Não há evidência** de que decisões de versões anteriores à revisão 2 tenham
  sido preservadas, e este documento não afirma isso.
- Mudanças em relação à revisão 7: relatório de revisão 8 (entregue fora do repositório; não é artefato da `main`).
- **Reconciliação documental (14/10/2026), sobre `origin/main` @ `e4f2aa5`:** atualiza estados de aprovação, gates e a nota de TTL nos três documentos; **não**
  altera a técnica proposta e **não** implementa nada.
- **Nenhum código e nenhum teste foram executados na revisão 8 nem na reconciliação.**

## Context

`apps/web` é o scaffold do `create-next-app`. A SPR-015 entrega fundação de autenticação, sessão e autorização no frontend (login,
sessão, listagem/criação de `Project`) contra a API **existente**, sem alterá-la. Documentos relacionados (mesmo estado documental — ver Status):
`engineering/designs/SPR-015-frontend-foundation.md` e `engineering/backlog/SPR-015.md`.

### Contexto de execução

| Item | Estado |
|---|---|
| Ambiente de trabalho **Windows** | **[INFO]** não verificado (nada foi executado no Windows) |
| `main` **protegida**; mudanças só por branch → PR → merge | **[INFO]**; a proteção não é verificável a partir do repositório; o histórico de merges e o `CONTRIBUTING.md` são compatíveis **[FATO-L]** |
| Patches em `C:\Users\marceloferreira\Downloads` | **[INFO]** |
| Docker Compose em `.\docker\docker-compose.yml` | **[INFO]**; arquivo **lido** (**[FATO-L]**, F25); **não executado** |
| `apps/api` não pode ser alterada sem autorização arquitetural específica | **[INFO]** — tratado como restrição |

### Fatos verificados

**API (`apps/api`)** — todos **[FATO-L]**; nenhum foi reproduzido em execução.

- F1. `AuthService.refresh()`: `findByHash` → checa `expiresAt`/`revokedAt` → `issueTokens` → `markRotated`. Quatro operações separadas,
  sem transação nem atualização condicional. Guards/pipes (respostas `4xx`) executam **antes** de `AuthService`.
- F2. Token com `revokedAt` preenchido → `revokeAllForUser(userId)` (revoga **todos** os refresh tokens ativos do usuário, em **todos os
  dispositivos**) e `401` "Refresh token já utilizado…".
- F3. Consequência de F1+F2 (leitura, **não reproduzida**): (a) duas chamadas realmente simultâneas com o mesmo token podem ambas passar e
  gerar dois pares válidos; (b) uma chamada que chega **depois** de a primeira concluir, com o token antigo, derruba todas as sessões do
  usuário.
- F4. `POST /v1/auth/logout` não é `@Public()`: exige `Authorization: Bearer <access>` e `{ refreshToken }`; responde `204` sem corpo.
  `AuthService.logout()` retorna sem erro se o token não existe ou é de outro usuário — **o `204` é idêntico nos dois casos**. Revoga só o
  token informado. **O contrato atual não permite ao cliente comprovar revogação.**
- F5. Não existe logout só com refresh token, nem logout global, nem consulta do estado de um refresh token, nem chave de idempotência, nem
  janela de tolerância na renovação.
- F6. `JwtStrategy.validate()` devolve o payload sem consultar o banco. `GET /v1/users/me` carrega o usuário do banco.
- F7. `AuthResponseDto` tem só `accessToken` e `refreshToken`. O access JWT é assinado com `expiresIn: jwtAccessTtl` (carrega `exp`); o
  refresh é opaco e **sem expiração visível ao cliente**. Cada emissão recalcula a validade do refresh. Defaults de código `15m`/`7d`;
  `.env.example` da raiz traz os mesmos como **exemplo**. O valor **efetivo** de qualquer ambiente **não é verificável** a partir do
  repositório.
- F8. Envelopes: sucesso `{ success: true, data, timestamp }`; erro `{ success: false, error: { statusCode, error, message: string |
  string[] }, path, timestamp }`; `204` sem corpo; exceção não prevista → `500` genérico.
- F9. Sem `enableCors` em `main.ts`/`configure-app.ts`. Sem throttling em `app.module.ts` (busca não exaustiva).
- F10. `POST /v1/projects` → `201`; `GET /v1/projects?page&limit&status` → `data: { items, meta }`; `CreateProjectDto`: `name` obrigatório
  ≤120, `description` opcional ≤2000; `ValidationPipe` global (`forbidNonWhitelisted`), `400` com `message[]`.
- F11. `ProjectOwnershipGuard` (rotas `:id`): `404` inexistente, `403` projeto de outro dono sem admin. Fora do escopo desta sprint.

**Frontend, tooling e CI** — **[FATO-L]**, salvo indicação.

- F12. `apps/web`: `next@16.2.0`, React `^19.2.0`, `"type": "module"`; sem `proxy`/`middleware`, sem env, **sem script `test`**. Existem
  `lint` (`eslint --max-warnings 0`), `check-types` (`next typegen && tsc --noEmit`), `build` (`next build`), `dev` (`next dev --port
  3000`) e `start`. `turbo.json` não tem task `test`; o `package.json` raiz não tem script `test`. Raiz declara `engines.node >=18`;
  `.npmrc` vazio; `next@16.2.0` declara `engines.node >=20.9.0`.
- F13. Docs do Next 16.2.0: `middleware` deprecado → `proxy` (runtime Node.js); `cookies().set/delete` só em Server Functions e Route
  Handlers, **não na renderização de Server Components**; o Proxy também roda em rotas prefetchadas, deve fazer só checagens otimistas e
  não deve depender de módulos/globais compartilhados; checagem real "o mais perto possível dos dados" (DAL).
- F14. Registro npm: Vitest `5.0.3` = `latest` (engines `^22.12 || ^24 || >=26`; peer `vite ^6.4 || ^7 || ^8`); `4.1.11` (engines `^20 ||
  ^22 || >=24`).
- F17. `.github/workflows/ci.yml` usa Node 22 e executa **apenas passos de `api`**.
- F18. `apps/web/.gitignore` ignora `.env*` (`git check-ignore` confirma — **[FATO-E]**, revisão 3). O `.env.example` da raiz só tem variáveis da API.
- F19. `ENGINEERING_GUIDE.md`: checagem `pnpm --filter api test (ou equivalente do pacote afetado)`; teste unitário obrigatório para módulo
  novo/alterado.
- F20. Docs do Next 16.2.0: `redirect()` serve `307` (preserva o método) fora de Server Action e `303` dentro de uma; `NextResponse.redirect`
  aceita status explícito. **Num Route Handler que responde a POST, o redirect para uma página precisa ser `303`**.
- F21. Docs do Next 16.2.0: Route Handlers aceitam `GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS`; `OPTIONS` é automático. A doc consultada
  **não** declara a resposta para métodos não exportados (não se assume `405`; HIP-11).
- F22. Docs do Next 16.2.0: Server Actions comparam `Origin` com `Host`/`X-Forwarded-Host` e abortam se diferirem. **Route Handlers não têm
  verificação de origem documentada** — qualquer checagem neles é nossa. A doc cita `serverActions.allowedOrigins` para proxy reverso;
  **não verificado** como o Next obtém esses valores em cada deploy.
- F24. **Scripts reais.** Raiz: `build`, `dev`, `lint`, `format`, `check-types`, `api` (alias de `pnpm --filter api`), `db:generate|pull|push|
  migrate|studio` — **sem `test` e sem `test:e2e`**: `pnpm test:e2e` **na raiz não existe**. API: `build`, `start`, `start:dev`,
  `start:prod`, `lint` (**com `--fix`**), `test`, `test:e2e`. Web: ver F12. `db:migrate` é `prisma migrate dev`. O CI executa `pnpm
  --filter api exec prisma generate`, `pnpm --filter api exec prisma migrate deploy` e `pnpm --filter api test:e2e`.
- F25. **Docker e convenções.** `docker/docker-compose.yml` define o serviço `postgres` (`postgres:16`, contêiner `content-os-postgres`, porta
  `5432`, banco/usuário/senha `content_os`, volume nomeado, healthcheck `pg_isready`); `docker-compose.override.yml` repete a porta.
  `.env.example`: `PORT=3001`, `DATABASE_URL=postgresql://content_os:content_os@localhost:5432/content_os`, `JWT_SECRET` vazio,
  `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL=7d`. `CONTRIBUTING.md`: branches `main` e `feature/<nome>`, Conventional Commits; merges de PR
  recentes usam também `docs/…`. `.gitattributes`: `*.md text eol=lf`.
- F26. Docs do Next 16.2.0 (`instrumentation`): `register` é chamado **uma vez** quando uma nova instância do servidor é iniciada e **deve
  concluir antes de o servidor atender requisições**. O que ocorre se `register` lançar exceção **não consta** na leitura (HIP-23).
- F27. Estrutura de documentos do repositório (leitura): ADR = `Status / Context / Decision (### numerados) / Consequences / Future
  Evolution`; Design Doc = `# SPR-0NN — … (Design Doc)`, `Status:`, `Contexto`, `Objetivo`, …, `Divisão em blocos`, `Fora de escopo`, e, **só
  após a aprovação**, `DESIGN FREEZE`; backlog = `Objetivo`, `Bloco X` com checkboxes e `**Critério de saída:**`, `Fora de Escopo`.

- F28. **TTL do refresh token (reconciliação de 14/10/2026).** **[FATO-L]** `apps/api/src/config/configuration.ts` define `refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d'`; `AuthService.calculateRefreshExpiry()` calcula a expiração persistida do refresh token a partir desse valor, via `parseTtlToMs`, que aceita `ms`, `s`, `m`, `h` e `d` e lança erro quando o formato não corresponde; `env.validation.ts` exige apenas que `JWT_REFRESH_TTL` seja string não vazia, **sem validar o formato da duração no bootstrap** (o formato inválido só é detectado quando o parser executa). **[INFO]** (saída de PowerShell fornecida pelo responsável técnico; `apps/api/.env` é ignorado pelo Git e **não** foi lido nesta reconciliação): o `.env` local tinha `JWT_REFRESH_TTL=7d`, equivalente a **604.800 segundos** — referência compatível para o ambiente local naquele momento. Isso **não** prova o valor efetivo de staging/produção nem exclui sobrescrita por variável de ambiente externa: a configuração dos demais ambientes **ainda precisa ser confirmada antes da implantação**. `SESSION_COOKIE_MAX_AGE_SECONDS` é obrigatório e **não pode exceder** o TTL efetivo do refresh token do ambiente correspondente; `604800` **não** é garantia universal. Nenhuma alteração em `apps/api` (inclusive no parser ou na validação de ambiente) é feita ou autorizada por esta reconciliação.

### Evidências existentes — todas de revisões anteriores, Linux descartável, **nenhuma repetida na revisão 8**

- **[FATO-E]** (revisão 3; Linux, Node 22.22.2, pnpm 11.11.0, cópia de `main` em `/tmp`, app = **scaffold**): `vitest@5.0.3` e `4.1.11`
  executaram **5 testes de exemplo** (TS ESM, `NextRequest`/`NextResponse` com atributos de `Set-Cookie`, `fetch` mockado, single-flight com
  `Promise.all`); com `5.0.3` e um script `test` de exemplo: `pnpm --filter web test`, `check-types`, `lint`, `build` com exit 0; `pnpm
  --filter web test` **sem** script ⇒ exit 0 **sem saída** (falso verde); com script e **sem** arquivos de teste ⇒ exit 1; `turbo run test`
  ⇒ task inexistente.
- **[FATO-E]** (revisão 5; plataforma): `new URL(s).origin` é **leniente** (`https://a.com/x` e `https://user:pw@a.com` ⇒ `https://a.com`; `HTTPS://A.COM`
  ⇒ `https://a.com`; porta padrão omitida; `file:`, `chrome-extension:`, `data:` ⇒ string `"null"`; `new URL("null")`, `new URL("")` e texto livre
  **lançam**; dois `Origin` viram `"a, b"` em `Headers.get`).
- **Limites:** não é Windows, não é Node 20, não é o código da SPR-015, não é CI, **nenhum teste da feature existe**.

## Decision

Salvo **P1, P3, P5 e P12** (**[APROV]**, regra central; ver "Estado das decisões"), as decisões abaixo são **[PROP]** e **[PEND]**. A tabela de estado, a matriz completa e os gates estão em "Estado de decisões, riscos
e gates".

### 1. Fronteiras arquiteturais — [PROP][PEND]

| Componente | Responsabilidade | O que **não** faz |
|---|---|---|
| Navegador | exibe páginas; envia formulários `POST` | não vê tokens; não chama a API |
| `proxy.ts` | navegação **otimista**: redireciona a `/login` se **não há** o cookie `cos_access` | **não autentica**, não chama a API, não grava cookies, não depende de estado compartilhado |
| Server Components | leem dados via DAL | **não gravam cookies**, **não renovam** token |
| Server Actions / Route Handlers | gravam/removem cookies; chamam a API via DAL | não decidem autorização (a API decide) |
| DAL (`lib/server/api-client.ts` + `session.ts`) | **único** ponto de acesso à API; envia `Bearer`; classifica respostas | não expõe token, corpo bruto nem `path` à interface |
| API (`apps/api`) | **autoridade** de autenticação, autorização, rotação e revogação | **não é alterada por esta sprint** |

**Regra:** qualquer estratégia que exija mudança na API (O1a/O1b) é registrada como **dependência de decisão arquitetural** e, quando
aplicável, de uma **ADR de segurança separada** e de autorização específica para `apps/api`. Nada nesta ADR trata mudança na API como
autorizada.

### 2. Cookies e configuração (P1) — [APROV] (regra central); detalhamento [PROP]

**P1 aprovada (regra central):** `SESSION_COOKIE_MAX_AGE_SECONDS` é obrigatória, **sem fallback silencioso**, e **não pode exceder** o TTL efetivo do refresh token aceito pela API. O que não consta dessa regra (por exemplo `instrumentation.ts`, "se aprovado e verificado", e as alternativas (a)/(b) abaixo) segue **[PROP][PEND]**.

**Variáveis (nomes propostos), todas só de servidor (sem `NEXT_PUBLIC_`), obrigatórias, sem valor padrão silencioso:**

| Variável | Regra de validação |
|---|---|
| `API_BASE_URL` | URL absoluta `http`/`https` válida, sem credenciais embutidas; ausente/inválida ⇒ falha fechada |
| `SESSION_COOKIE_MAX_AGE_SECONDS` | inteiro positivo (somente dígitos); ausente/zero/negativo/não numérico ⇒ falha fechada. **Operacionalmente não superior** ao `JWT_REFRESH_TTL` **efetivo** da API do mesmo ambiente |
| `APP_ORIGIN` | origem `http`/`https` pura (esquema+host+porta; sem path/query/userinfo); ausente/inválida ⇒ falha fechada (§8) |

**Validação e falha:** a configuração é lida por uma função pura (`loadConfig`) executada **na primeira utilização** e, **se aprovado e
verificado**, também na **inicialização do servidor** via `instrumentation.ts` — `register` roda uma vez antes de o servidor atender
(F26); se uma exceção ali impede a subida é **hipótese** (HIP-23). Com valor ausente ou inválido, nenhuma ação de sessão é executada: a
requisição recebe erro genérico (`500`), o motivo vai só ao log (sem valores sensíveis).

**Alinhamento com o TTL da API:** os defaults `15m`/`7d` **não** devem ser presumidos como valores efetivos (F7). A conferência é **humana**
e deve ser **registrada** no relatório de cada ambiente (valor efetivo de `JWT_REFRESH_TTL` lido da configuração da API **daquele** ambiente
× valor de `SESSION_COOKIE_MAX_AGE_SECONDS`). O frontend **não** consegue verificá-la.

**Nota de TTL (reconciliação de 14/10/2026).** **[FATO-L]** `apps/api/src/config/configuration.ts` define `refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d'`; `AuthService.calculateRefreshExpiry()` calcula a expiração persistida do refresh token a partir desse valor, via `parseTtlToMs`, que aceita `ms`, `s`, `m`, `h` e `d` e lança erro quando o formato não corresponde; `env.validation.ts` exige apenas que `JWT_REFRESH_TTL` seja string não vazia, **sem validar o formato da duração no bootstrap** (o formato inválido só é detectado quando o parser executa). **[INFO]** (saída de PowerShell fornecida pelo responsável técnico; `apps/api/.env` é ignorado pelo Git e **não** foi lido nesta reconciliação): o `.env` local tinha `JWT_REFRESH_TTL=7d`, equivalente a **604.800 segundos** — referência compatível para o ambiente local naquele momento. Isso **não** prova o valor efetivo de staging/produção nem exclui sobrescrita por variável de ambiente externa: a configuração dos demais ambientes **ainda precisa ser confirmada antes da implantação**. `SESSION_COOKIE_MAX_AGE_SECONDS` é obrigatório e **não pode exceder** o TTL efetivo do refresh token do ambiente correspondente; `604800` **não** é garantia universal. Nenhuma alteração em `apps/api` (inclusive no parser ou na validação de ambiente) é feita ou autorizada por esta reconciliação.

**Limites do que o frontend garante:** o `Max-Age` é uma **dica de ciclo de vida do cookie**, não prova de validade do token. A validade
real é a que a API reconhece (resposta `401`). Valor maior que o TTL real ⇒ o cookie sobrevive ao token e a API responde `401` (custo: um
login). Valor menor ⇒ login mais cedo que o necessário. Nenhum dos dois cria acesso indevido.

| Cookie | Bloco | `Path` | Atributos | `Max-Age` | Conteúdo |
|---|---|---|---|---|---|
| `cos_access` | A/B1 | `/` | `HttpOnly`; `SameSite=Lax`; `Secure` se `NODE_ENV=production` (HIP-6); sem `Domain` | `SESSION_COOKIE_MAX_AGE_SECONDS` (**não** o `exp` do JWT: o Proxy só vê presença) | access token |
| `cos_refresh` | A/B1 | `/api/session` | idem | idem | refresh token (só viaja a `/api/session/*`) |
| `cos_renewed` | **B2** | `/` | idem | curto (ponto de partida 30 s — HIP-12) | marcador anti-laço (valor fixo, sem token) |

- **Remoção:** reemitir `Set-Cookie` com **o mesmo `Path`**, `Max-Age=0` e valor vazio, para todos os cookies existentes no bloco (B1: dois;
  B2: três). Sem o mesmo `Path` o navegador não remove.
- Sem prefixos `__Host-`/`__Secure-`: `__Host-` exige `Path=/` (incompatível com o refresh restrito) e `__Secure-` exige `Secure`
  (quebraria o desenvolvimento em HTTP).
- A cada rotação bem-sucedida (B2) os cookies são regravados com `Max-Age` cheio, espelhando a janela deslizante do servidor (F7).
- Alternativas (**[PEND]**): (a) cookies de sessão do navegador (sem `Max-Age`): sem configuração, mas perde o login ao fechar o navegador;
  (b) a API devolver a expiração do refresh: exige mudar `apps/api` (dependência de decisão, §1).

### 3. Proxy e autorização efetiva no servidor — [PROP][PEND]

**Limites do Proxy [FATO-L por F13; consequências analíticas]:**
- Verifica só a **presença** de `cos_access`. Um cookie **obsoleto, expirado, forjado ou de usuário revogado passa** pelo Proxy; quem decide é
  a API (JWT sem consulta ao banco, F6, valida assinatura e `exp`).
- **Não é autenticação** nem autorização; serve apenas para navegação otimista (`/login?next=`). Matcher exclui `_next`, estáticos, `/login`,
  `/session/*` e `/api/session/*`. Não redireciona "usuário logado" para fora de `/login` (evita laço com cookie obsoleto).
- Prefetch também o executa (F13) ⇒ não renova, não grava cookies, não depende de estado global.

**DAL único** (`lib/server/api-client.ts` + `session.ts`): todo acesso a dado protegido passa por ele; envia `Bearer`, `cache: 'no-store'`,
timeout, e classifica:

| Resposta | Server Component | Server Action / Route Handler |
|---|---|---|
| `2xx` válido (F8) | renderiza | sucesso |
| `401` | `redirect` a `/session/continue?mode=end` (**B1**); à etapa de renovação ou `end` (**B2**, §4) | `session-expired` + URL da etapa |
| `403` | "sem permissão"; cookies **intactos** | `forbidden` |
| `404` | "não encontrado" | `not-found` |
| `400` | n/a | erros por campo de `message[]` |
| `5xx`, rede, timeout, corpo fora de F8 | "serviço indisponível"; **não** remove cookies, **não** renova | `unavailable` |

O `5xx` em **leitura/mutação de dados** não envolve rotação de token; a ambiguidade do §6 vale só para a **renovação**. A presença do cookie
**nunca** é prova de sessão. Nada de token, stack, `path` ou corpo bruto chega à interface.

### 4. Fluxo de sessão: `end` (B1) e `renew` (B2) — P10 — [PROP][PEND]

**Semântica dos modos da etapa intermediária `GET /session/continue?mode=…&next=…` (página **sem efeitos**: não lê cookies de sessão, não
chama a API, não grava cookies; valida `next` e `mode` — lista fechada):**

| `mode` | Bloco | Comportamento |
|---|---|---|
| `end` | B1 | formulário `POST /api/session/end` com envio único automático (botão de contingência sem JavaScript); **encerra a sessão local sem chamar a API**; destino `/login?reason=session` |
| `renew` | B2 | formulário `POST /api/session/renew` com `next` oculto; **tenta renovar**; sucesso ⇒ `303` ao `next` validado |
| `unavailable` | B2 | exibe "serviço indisponível" e botão "Tentar novamente" (`renew`); **sem envio automático** |

**Por que não `GET` que renova** (revisão 3, abandonada): um `GET` não pode alterar a sessão — prefetch, pré-visualização, novas tentativas
do navegador e navegação iniciada por terceiros (`SameSite=Lax` envia cookies em navegação de topo por `GET`) poderiam disparar rotações.

**Alternativas avaliadas:** `GET` que renova (rejeitada); **etapa `GET` sem efeitos + `POST` Route Handler (proposta)**; Server Action em
página sob o `Path` do refresh (viável: Origin/Host nativos e `303` automático, F20/F22, mas exige `Path` mais amplo e é mais difícil de
testar); renovar no Proxy (rejeitada, F13); renovar em Server Component (impossível, F13); `fetch` `POST` do navegador (equivale com mais
JavaScript).

**Handlers `POST` (só `POST` exportado):** `end` (B1), `logout` (B1/B2), `renew` (B2). Todos: **validam a origem antes de qualquer outra ação**
(§8); respondem `303` (F20) com `Cache-Control: no-store`.

**`renew` (B2):** (a) origem; (b) `next` válido; (c) sem `cos_refresh` ⇒ remove cookies e `303 /login?reason=session`, sem chamar a API;
(d) single-flight e `POST /v1/auth/refresh` com timeout; (e) classificação do §6; (f) sucesso ⇒ grava `cos_access`, `cos_refresh` e
`cos_renewed` e `303` ao `next`. **Destino preservado:** `next` percorre DAL → `continue` → `renew` → `303` (caminho e query intactos);
corpo de uma Server Action **não** é preservado.

**Redirecionamento seguro (`next`):** só caminho interno: começa com `/`, não com `//` nem `/\`, sem esquema, sem caracteres de controle;
`new URL(next, origem)` com mesma origem; rejeita alvos em `/api/session/*`, `/session/*` e `/login`; inválido ⇒ `/projects`. `reason` e `mode`
aceitam só listas fechadas. A validação ocorre na página `continue` **e** nos handlers.

**Anti-laço:** (i) `cos_renewed` (B2) é gravado só no sucesso da renovação; (ii) `401` com `cos_renewed` presente ⇒ `mode=end`; (iii)
`unavailable` nunca envia sozinho; (iv) falha ambígua/R ⇒ cookies removidos e `/login`, que o Proxy não redireciona; (v) o destino nunca é
`/session/*` nem `/login`; (vi) sem `cos_refresh` ⇒ `end`/login sem chamar a API. Em B1 (sem renovação) o `401` leva **sempre** a `end`.

### 5. Concorrência e risco de revogação global — P2/RA-2 — [PROP][PEND]

#### 5.1 O que o single-flight em memória faz e não faz

Mecanismo (B2): `Map<sha256(refreshToken), Promise>` no módulo do handler `renew`; chamadas **no mesmo processo** que se **sobrepõem no
tempo** com o mesmo token aguardam a mesma promessa; a entrada sai no `finally`.

| Cenário | Efeito esperado | Protegido? |
|---|---|---|
| Dois envios do mesmo formulário, mesmo processo, sobrepostos | uma chamada à API | **Sim** |
| Duas abas, mesmo processo, requisições que chegam enquanto a primeira está em andamento | uma chamada à API | **Sim** (por temporização, não garantido) |
| Requisição **já enviada com o token antigo** que chega **depois** de a primeira concluir (**chegada tardia**) | API vê token reutilizado ⇒ **revoga todas as sessões do usuário** | **Não** |
| Vários processos (cluster, workers) | cada processo tem seu `Map` | **Não** |
| Várias instâncias/serverless | idem | **Não** |
| Reinício do processo ou recarga de módulo em dev (HIP-2) | `Map` perdido | **Não** |

O single-flight **não** protege contra chegada tardia e **não** coordena processos ou instâncias. Esta ADR não promete o contrário.

#### 5.2 Por que a janela existe — análise **[HIP-19]**, não medida

Os cookies são compartilhados entre as abas do mesmo navegador: cada `POST` de renovação leva o refresh token do repositório de cookies **no
instante do envio**. O single-flight cobre quem chega **durante** a renovação em andamento; fica descoberto quem **já foi enviado** com o token
antigo e chega **depois** — intervalo da ordem de **um percurso de ida e volta navegador↔servidor** após cada renovação, maior com latência,
carga e retomada simultânea de abas.

#### 5.3 Impacto operacional da revogação global (sem minimizar)

- A API revoga **todos** os refresh tokens ativos do usuário (F2): todas as sessões, em todos os dispositivos, perdem a capacidade de renovar
  e voltam ao login ao expirar o access token (F7).
- Perdem-se formulários não enviados e contexto de navegação em todos os dispositivos.
- Com vários usuários reais: picos de suporte e "tempestades de login"; um defeito sistemático produziria revogações repetidas.
- Revogação por reuso é, por desenho da API, indício de **roubo de token**; falsos positivos da nossa concorrência poluem monitoramento e
  dificultam separar ataque de defeito (não examinei se há monitoramento).
- Quem obtiver um refresh token antigo pode revogar as sessões da vítima ao reapresentá-lo: comportamento da API, **não criado nem corrigido**
  pela SPR-015.
- Não há, por esse mecanismo, exposição de dados nem acesso indevido; **mas o desfecho não é "mera indisponibilidade"**.

#### 5.4 Comparação das opções (todas **[PROP]**, nenhuma **[APROV]**)

**Tabela A — mecanismo, segurança, concorrência, cobertura**

| Opção | Mecanismo | Risco de segurança | Comportamento em concorrência | Cobertura de múltiplos processos/instâncias |
|---|---|---|---|---|
| **O1a** — API: atualização condicional | na API, a marcação do token como rotacionado passa a ser condicional (`revokedAt IS NULL`) | mantém a detecção de reuso; **não** introduz tolerância | fecha "dois pares válidos" (F3a). **Chegada tardia continua revogando tudo.** A requisição "perdedora" legítima passa a falhar: se for tratada como reuso, **revoga a família** (efeito depende do desenho — HIP-24) | **sim** para a atomicidade (estado no banco) |
| **O1b** — API: rotação atômica + tolerância/idempotência | além do claim atômico, reapresentar o token recém-rotacionado dentro de uma janela devolve resultado definido (replay idempotente) em vez de revogar | **enfraquece, por desenho, a detecção de reuso dentro da janela**; semântica de tolerância, idempotência, reutilização e revogação **sem análise de segurança**; **não está pronta para implementação** | trata simultâneas **e** tardias **dentro da janela**; fora dela, reuso ⇒ revoga | **sim** (estado no banco) |
| **O2** — single-flight + (se viável e validado) Web Locks | single-flight no processo; bloqueio entre abas do mesmo navegador antes do envio, mantido até `pagehide` (§5.5) | não cria credencial nova; não altera a API | coalesce sobrepostas no processo; serializa abas do mesmo navegador **se HIP-17/18**; **não** cobre envios fora da página `continue` | single-flight **não**; Web Locks **não é coordenação distribuída** (só o mesmo navegador); **não garante segurança distribuída** |
| **O3** — sessão no servidor | cookie com id opaco; tokens em armazenamento do servidor; renovação sob mutex por sessão lendo o token atual | tokens em repouso no servidor; nova superfície (fixação de sessão, limpeza); menos exposição no navegador | serializa por sessão **dentro de um processo**, sem depender do cookie do navegador | **só** com armazenamento compartilhado (infraestrutura/banco; fora do escopo) |
| **O4** — cache pós-conclusão | o frontend guarda por N s o par novo indexado pelo hash do token antigo e o devolve a quem reapresentar | **enfraquece a detecção de reuso por N s**: quem apresentar o token antigo nesse intervalo recebe o par novo; tokens em memória | cobre a chegada tardia ≈ um RTT, **no processo** | **não** |
| **O5** — nenhuma mitigação | só o single-flight por sobreposição | revogação global por chegada tardia/abas/processos | só sobrepostas no processo | **não** |
| **O6** — maior TTL do access (configuração da API) | aumenta `JWT_ACCESS_TTL` para renovar menos | **amplia** o uso de access token comprometido (F6: sem consulta ao banco) | reduz a frequência de renovação; **não** elimina a janela | reduz proporcionalmente; **não** cobre |
| **O7** — dividir o Bloco B | B1 sem renovação; B2 com renovação | elimina o risco de reuso em B1/C | em B1 **não há** renovação | B1 sem exposição; B2 herda a opção escolhida |

**Tabela B — implementação, verificabilidade, riscos residuais, dependências**

| Opção | Impacto de implementação | Verificabilidade | Riscos residuais | Dependências |
|---|---|---|---|---|
| **O1a** | altera `apps/api` (serviço/repositório de refresh), testes da API | testes unitários/E2E da API (não executados; E2E exige Postgres) | chegada tardia integral; perdedora legítima; RA-1 parcialmente | **autorização arquitetural** para `apps/api`; decisão sobre o tratamento da perdedora |
| **O1b** | altera `apps/api` e possivelmente modelo de dados (migração — fora do escopo); muda comportamento do contrato | testes da API + modelagem de ameaça (não executados) | a janela de tolerância; reuso fora da janela; **P11 precisa ser reavaliada** | **autorização específica** + **ADR de segurança própria**; possível migração |
| **O2** | só `apps/web`, bloco **B2** (componente cliente + política) | **só smoke em navegador** para a eficácia; política testável com `navigator.locks` simulado (não prova o navegador real) | sem JavaScript; navegador sem a API/contexto inseguro; tempo esgotado; reenvio de `POST` fora do controle (HIP-19); falhas ambíguas; multi-instância não coberta | HIP-17/18/19/20; P10; P2 |
| **O3** | redesenho de §2/§4 (substitui cookies de token por id de sessão); novo componente | testes + smoke (não verificado) | reinício derruba sessões (login, não revogação); multi-processo exige armazenamento compartilhado | decisão de infraestrutura; novo ADR |
| **O4** | pequeno, em `apps/web` | só API simulada (modelo assumido) | janela N; multi-processo; tokens em memória (despejo de heap) | **análise de segurança específica** + ADR |
| **O5** | nenhum | n/a | todos os da §5.1 | — (**não recomendada**) |
| **O6** | configuração do ambiente da API (não é código) | n/a | a janela permanece; exposição maior de access token | decisão de segurança operacional |
| **O7** | reordena o backlog (A → B1 → C → B2) | testes (B1/C) | sessão curta em B1/C (TTL efetivo desconhecido, F7); B2 depende de P2/P11 | P2, P10, P11 |

#### 5.5 Mitigação no frontend × correção na API; e o Web Locks

- A correção atua **onde o estado vive**: a rotação e a regra de reuso estão na API/banco (F1/F2). Só mudanças lá (O1a em parte, O1b) podem
  tornar a renovação segura contra simultaneidade e reapresentação em qualquer topologia — **sujeitas a ADR de segurança e a autorização**;
  nenhuma está pronta para implementação.
- **Mitigações no frontend** (O2, O3, O4, O7) reduzem a probabilidade **apenas das requisições que o próprio frontend controla**; **não**
  tornam a rotação atômica nem a reapresentação segura, e **mitigação exclusivamente no navegador não é garantia de segurança distribuída**.

**O2 — detalhe (somente se escolhida; B2):** (1) no componente cliente da página `continue` (`mode=renew`), solicitar o bloqueio
`navigator.locks.request('cos-session-renew', { signal: <espera> }, …)`; (2) detendo o bloqueio, enviar o formulário e **mantê-lo até o evento
`pagehide`** — quando a navegação é confirmada, **depois** de o navegador ter processado o `Set-Cookie` da `303` — ou até um limite de
retenção; (3) outra aba aguarda e, ao obter o bloqueio, envia o `POST` com o refresh token **novo** do repositório de cookies (rotacionar de
novo é uso válido); (4) espera esgotada ⇒ **não envia**, mostra `unavailable`, cookies intactos; (5) sem `navigator.locks` ⇒ proposta de
seguir **sem** bloqueio, com o risco residual declarado; (6) limites: pontos de partida **15 s** (retenção) e **20 s** (espera) — HIP-20.

**O2 não é garantia contra todas as formas de concorrência.** Não cobre: caminho sem JavaScript; navegadores sem a API ou contextos
inseguros; esgotamento de tempo; reenvio de `POST` fora do nosso controle (HIP-19); falhas ambíguas (§6); apresentação do refresh token por
caminho que não passe pela página `continue`; requisições de outros navegadores/dispositivos; múltiplos processos/instâncias; nem a correção
da API.

**Fontes sobre a Web Locks API (secundárias; consultadas por busca na revisão 6; não verificadas em navegador):** MDN indica contexto seguro
(HTTPS), escopo por origem e liberação ao fim da tarefa; um caso de teste da plataforma web (WPT) trata liberação em documentos descarregados;
um relatório do WebKit descreve um defeito (já corrigido) com *Workers* no Safari. Que `localhost` seja contexto seguro é conhecimento geral,
**não verificado**. Estado: **HIP-17 e HIP-18 não verificadas.**

#### 5.6 Uso por vários usuários e por múltiplas instâncias

- **Vários usuários:** cada incidente de revogação global afeta **todos os dispositivos de um usuário**; a frequência cresce com usuários e
  abas. Sem correção na API, o risco é **operacional** (suporte, perda de sessão) e **de monitoramento** (falsos positivos).
- **Múltiplos processos/instâncias:** o single-flight **não coordena**; O2 só ajuda no **mesmo navegador**; O3 só com armazenamento
  compartilhado; **só O1b** cobre qualquer topologia (e, antes de ADR de segurança, **não está pronta**).

#### 5.7 Estratégias candidatas, riscos remanescentes e condições impeditivas — [PROP][PEND]

| Estratégia | Composição | Riscos que permanecem | Impedimento de implantação |
|---|---|---|---|
| **E-P** (principal proposta) | O7 + O2 + single-flight; O1b **registrada** como pré-requisito para qualquer implantação além de uso individual/desenvolvimento | RA-2 **reduzido, não eliminado**; sessão curta em B1/C; custos de P11; RA-14 | [BLQ-DEPL] O1b implementada e aprovada, **ou** aceite explícito, informado e documentado do Arquiteto-Chefe sobre o impacto do §5.3; smoke de HIP-17/18 registrado |
| **E-A** (alternativa proposta) | O1b **antes**, em sprint própria da API (autorização + ADR de segurança), depois a SPR-015 integral | janela de tolerância; mudança na semântica de segurança da API; atraso | [BLQ-DEPL] ADR de segurança da API aprovada e implementada; P11 reavaliada |

**Condições comuns de implantação [BLQ-DEPL]** (todas **pendentes**/não verificadas): (1) ambiente de implantação definido (HIP-1); (2) web no
CI (P9) ou porta de validação equivalente; (3) política de origem validada no ambiente real, inclusive atrás de proxy (HIP-7, 15, 16); (4)
verificações em Windows/Node 22 e `next build` do código final executados e registrados; (5) smoke contra a API real registrado; (6)
decisão sobre rate limiting do login (RA-4); (7) `SESSION_COOKIE_MAX_AGE_SECONDS` ≤ `JWT_REFRESH_TTL` efetivo de cada ambiente, conferido.

**Recomendação técnica [PROP]:** E-P como principal; **E-A preferível se houver previsão próxima de uso multiusuário ou de mais de um
processo/instância**. Não recomendadas: O1a (parcial; pode converter a corrida em revogação), O3 e O4 (ampliam escopo ou enfraquecem a
detecção de reuso sem verificação), O5, O6. **O1b não é apresentada como solução pronta.**

#### 5.8 Estado de aprovação

**P2/RA-2 e O7 estão PENDENTES [PEND]**; decisão específica do Arquiteto-Chefe exigida (escolha da estratégia e aceite — ou recusa — dos
riscos residuais). Este documento **não aceita risco algum em seu nome**. [BLQ-IMPL] **B2**.

### 6. Falhas ambíguas da renovação — P11 — [PROP][PEND]

**Princípio:** nenhum código HTTP isolado prova se a rotação ocorreu (F1, F5: sem transação, sem idempotência, sem consulta de estado). O
cliente só age sobre o que **consegue provar**.

**Casos e o que se sabe:**

| Caso | O que o cliente sabe | O servidor pode ter… |
|---|---|---|
| **N** — requisição comprovadamente não enviada (conexão recusada, DNS, timeout de conexão — HIP-5) | o token **não foi consumido** | — |
| **R** — `4xx` com corpo F8 (guards/pipes e o `401` do serviço antecedem `issueTokens`/`markRotated`, F1) | a requisição foi rejeitada **antes** da rotação | — |
| **A1** — `5xx` (inclui `502/503/504`, que podem vir de intermediário) | falhou em **algum** ponto | falhado antes da emissão, entre emissão e `markRotated`, ou **depois** de `markRotated` (rotação feita) |
| **A2** — timeout ou conexão interrompida **depois** do envio | enviou; **não recebeu** resposta | processado por completo, parcialmente ou nada |
| **A3** — `2xx` ilegível, incompleto ou fora do formato F8 | a API respondeu sucesso, mas o par **não pôde ser lido** | rotação **provavelmente feita** (novo par perdido) |
| **A4** — erro de rede sem classificação confiável | **não sabe** se enviou | qualquer um dos estados |
| **Transversal** | — | pode ter rotacionado o token **apesar** da falha percebida |

**Comportamentos considerados (para A1–A4):**

| Comportamento | Prós | Contras | Impacto para o usuário | Riscos |
|---|---|---|---|---|
| **B-a (proposto)** — remover cookies e voltar ao login (`reason=renewal`), sem repetir o token | evita reapresentar token possivelmente rotacionado (e a revogação global); pior caso = **um** login em **um** dispositivo; determinístico e testável; não insiste em API falhando | desloga também em quedas transitórias; mascara falhas como "sessão expirada" (mitigado por `reason` e log) | novo login; perda de formulários | token antigo possivelmente válido e sem dono até expirar (RA-10); falhas induzidas forçam logouts |
| **B-b** — manter cookies, exibir "indisponível", retry **manual** com o mesmo token | melhor em quedas transitórias, se a falha ocorreu antes da rotação | se a rotação ocorreu, o retry reapresenta token rotacionado ⇒ **revogação global** | sem login imediato; possível perda total depois | **alto impacto**: revogação em todos os dispositivos; a proporção real de `5xx` anteriores à rotação **não foi medida** (HIP-21) |
| **B-c** — retry automático com o mesmo token | recupera falhas puramente transitórias sem intervenção | idem B-b, com mais insistência e sem ação do usuário; pressão sobre a API | transparente quando funciona | **maior** risco de revogação global; amplia carga durante instabilidade |
| **B-d** — manter cookies sem retry (só navegação posterior) | não desloga na hora | o próximo acesso repete o problema do B-b | confuso | igual ao B-b adiado |

**Proposta [PROP][PEND]:** **B-a** para **A1–A4**; **N** mantém cookies com nova tentativa **manual** (token não consumido); **R** remove cookies
e vai ao login (`reason=session`). **Assimetria preservada:** errar para o lado de **limpar** custa **um novo login em um dispositivo**; errar
para o lado de **tentar de novo** custa, se a rotação já ocorreu, **todas as sessões do usuário em todos os dispositivos** (F2). Com o contrato
atual o cliente não distingue os casos (F5). **Esta política é proposta pendente, não decisão aprovada.**

**Como a política pode mudar se O1b for implementada:** se a API passar a oferecer **tolerância/idempotência** (reapresentar o token recém-
rotacionado, dentro de uma janela, devolve um resultado definido sem revogar), A1/A2 (e A3 por replay) poderiam admitir **uma** nova tentativa
**limitada** com o mesmo token, **dentro da janela**, sem risco de revogação; fora da janela, B-a continuaria. Isso **depende** do contrato
exato da O1b (tamanho da janela, o que é devolvido, auditoria), que **não existe** e exige ADR de segurança. Até lá, **P11 deve ser
reavaliada** se O1b for aprovada. **[BLQ-IMPL] B2.**

### 7. Logout e revogação — [PROP][PEND]

`POST /api/session/logout` (só `POST`; origem validada antes de agir; `303 /login`; `no-store`), por `<form method="post">`. **Os cookies locais
são removidos (mesmo `Path`) na mesma resposta em todos os desfechos.** Quatro dimensões **não se confundem**:

1. **Resposta HTTP observada** da API (o que o cliente viu).
2. **Estado de revogação remota** — **nunca "confirmado"**: o contrato não permite (F4). Valores: `unconfirmed` (204: pode ter revogado),
   `token_unusable` (renovação rejeitada de forma conclusiva — B2), `not_revoked_by_call` (a chamada comprovadamente não saiu ou foi barrada
   pelo guard antes da lógica), `unknown` (ambíguo), `not_attempted`.
3. **Limpeza dos cookies locais:** sempre.
4. **Mensagem ao usuário:** de lista fechada — **A** "Você saiu." (não afirma revogação) ou **B** "Você saiu deste dispositivo. Não foi possível
   confirmar o encerramento da sessão no servidor."

| # | Resposta/resultado observado | Revogação remota | Cookies | Msg | Bloco |
|---|---|---|---|---|---|
| L1 | logout → `204` | `unconfirmed` | removidos | A | B1 |
| L4 | requisição de logout comprovadamente não enviada | `not_revoked_by_call` | removidos | B | B1 |
| L5 | logout → timeout, conexão interrompida ou `5xx` | `unknown` | removidos | B | B1 |
| L6 | logout → `4xx` diferente de `401` (inesperado) | `unknown` | removidos | B | B1 |
| L7′ | logout → `401` (access expirado), **sem renovar** | `not_revoked_by_call` (o `401` vem do guard, antes da lógica — F4) | removidos | B | B1 |
| L9 | sem `cos_refresh` | `not_attempted` | removidos | A | B1 |
| L2 | logout → `401`; renovação ok; novo logout → `204` | `unconfirmed` | removidos | A | B2 |
| L3 | logout → `401`; renovação rejeitada de forma conclusiva (R) | `token_unusable` | removidos | A | B2 |
| L7 | logout → `401`; renovação não enviada (N) | `not_revoked_by_call` | removidos | B | B2 |
| L8 | logout → `401`; renovação ambígua (A1–A4) | `unknown` | removidos | B | B2 |

Em `unconfirmed`, `unknown` e `not_revoked_by_call` o refresh token pode seguir válido no servidor até expirar; o cliente não tem como
saber. Sem fila de reenvio (exigiria infraestrutura). Nenhuma mensagem afirma revogação, nem que "nada foi revogado". O log registra as
dimensões 1–3, sem tokens.

### 8. Validação de origem (CSRF) nos Route Handlers — P12 — [APROV] (regra central); detalhamento [PROP]

**P12 aprovada (regra central):** `APP_ORIGIN` é a origem canônica; o header `Origin` é validado **estritamente antes de ler o body, tocar cookies ou chamar a API**; `Host` e `X-Forwarded-*` **não** substituem essa validação. O detalhamento abaixo (categorias de recusa, formato da resposta `403`, log) é o desenho proposto para cumprir essa regra.

**Escopo:** `POST /api/session/end`, `/logout` (B1) e `/renew` (B2) — **aplicação consistente nos três**. Server Actions têm verificação nativa
(F22). **Modelo de ameaça:** página de outro site induz o navegador da vítima a enviar um `POST`. Camadas: método `POST`; `SameSite=Lax`
(comportamento padrão de navegadores, **não verificado aqui**); validação de origem abaixo. Não se pretende defender de clientes que não são
navegadores (não possuem os cookies da vítima).

**Origem esperada vem de configuração, não de cabeçalhos da requisição:** `APP_ORIGIN` (§2). **`Host` e `X-Forwarded-*`/`Forwarded` não são lidos
nem usados como substitutos** da validação de `Origin`: `Host` não carrega esquema; a comparação literal `Origin`×`Host` ignora esquema e
porta; esses cabeçalhos só são confiáveis se um proxy confiável sobrescrever os valores do cliente — **não verificável** (HIP-1).

**Regra (função pura; executa antes de ler corpo ou cookies e antes de chamar a API):**

| Situação | Detecção | Resultado |
|---|---|---|
| `APP_ORIGIN` ausente/inválida/não-http(s)/com path | validação de configuração (§2) | falha fechada: erro genérico; nenhuma ação de sessão; categoria `config` |
| `Origin` **ausente** | cabeçalho inexistente | **recusa** (`absent`) |
| `Origin` **inválida** (`null`, vazia, texto livre, não interpretável por `URL`) | falha de parse / valor `null` | **recusa** (`null`/`invalid`) |
| `Origin` **múltipla** (`"a, b"`) | vírgula/múltiplos valores | **recusa** (`invalid`) |
| `Origin` **não canônica** (path, barra final, userinfo, maiúsculas, espaços) | texto do cabeçalho ≠ `new URL(h).origin` | **recusa** (`non_canonical`) |
| esquema não `http`/`https` (`file:`, `chrome-extension:`, `data:`; origem opaca `"null"`) | `protocol` | **recusa** (`scheme`) |
| **esquema, host ou porta divergentes** de `APP_ORIGIN` (porta padrão ≡ sem porta) | `new URL(h).origin` ≠ `new URL(APP_ORIGIN).origin` | **recusa** (`mismatch`) |
| `Origin` válida e igual | — | segue o fluxo |

**Requisição rejeitada:** `403` com corpo neutro, **sem `Set-Cookie`** (nem de remoção), **sem chamada à API**, sem redirecionamento, `Cache-Control:
no-store`; log só com a **categoria**, sem tokens nem valores dos cabeçalhos. **Política de falha segura:** não conseguir validar ⇒ nenhuma ação de sessão e
nenhum cookie alterado. **Custo:** navegadores/extensões que omitam `Origin` em `POST`, ou acesso por origem diferente da configurada (ex.:
`127.0.0.1` em vez de `localhost`), são recusados (HIP-15). Sem fallback por `Referer`/`Sec-Fetch-Site` nesta proposta.

**Proxy reverso:** suposição zero sobre cabeçalhos encaminhados; `APP_ORIGIN` deve ser a origem **pública** vista pelo navegador. Origem
diferente da configurada ⇒ todos os `POST` de sessão recusados (visível em log e no smoke). Server Actions atrás de proxy podem exigir
`serverActions.allowedOrigins` (HIP-16) — **fora do escopo** até existir deploy.

**Desenho × comprovação:** o **desenho** acima é proposta; **funciona no ambiente real?** — **não comprovado**: depende de os navegadores enviarem
`Origin` no `POST` do formulário (HIP-15), do comportamento do proxy/deploy (HIP-7/16) e da execução real dos handlers no Next. Os testes
unitários/de integração simulada **não** substituem o smoke em navegador. **Alternativas (nenhuma adotada):** comparar com `Host`/`X-Forwarded-Host`;
aceitar `Origin` ausente quando `Sec-Fetch-Site: same-origin`; lista de origens; token CSRF por sessão.

### 9. Ambiente, testes e execução — P3/P5 — [APROV] (regra central); detalhamento [PROP]

- **Node.js 22, versão mínima 22.12** **[APROV]** (P3; `engines` do monorepo **não** é alterado): exigida pelo Vitest 5.0.3 (`^22.12 || ^24 || >=26`; 23.x e 25.x **não**) **[FATO-L]**; o CI já usa
  Node 22 **[FATO-L]**; `next@16.2.0` exige `>=20.9.0`. **Conflito** com `engines.node >=18` da raiz: **documentado, sem alterar `package.json`** (P8).
  **Verificação real de compatibilidade:** `vitest@5.0.3` e `4.1.11` rodaram em **Linux/Node 22.22.2 sobre o scaffold** **[FATO-E]**; **Windows, Node 20 e
  o `next build` do código final NÃO foram verificados.**
- **Vitest `^5.0.3`** para testes unitários do frontend **[APROV]** (P3/P5); **sem Playwright e sem Testing Library** — só com autorização explícita **[APROV]** (P5) (a decisão é do
  Arquiteto-Chefe; consequências: cobertura de navegador só por smoke manual).
- **Níveis:** U (unitário, sem rede); I (integração com **API simulada** `node:http` local); M (smoke manual contra a **API real** + Postgres do
  Compose). Testes U e I **não comprovam** o comportamento real do Next.js, do navegador **nem da API em falhas pós-rotação**.
- **Evidências exigidas por bloco:** saída dos comandos abaixo registrada no relatório técnico; contagem de testes; lista dos critérios de
  aceite (Design Doc) atendidos e dos **não verificados**.
- **Comandos reais (existentes):** `pnpm --filter web lint | check-types | build | dev | start`; `pnpm --filter api test | test:e2e | build |
  start:dev`; `pnpm --filter api exec prisma generate | migrate deploy`; `pnpm install --frozen-lockfile`;
  `docker compose -f .\docker\docker-compose.yml up -d` (sintaxe v2 — HIP-22, **não verificada** na máquina do Arquiteto-Chefe).
  **Cautela:** `pnpm --filter api lint` usa `--fix` (altera arquivos) — **não executar** em tarefas documentais; usar só no encerramento, conferindo
  `git status`.
- **Comando que só existirá após implementação autorizada:** `pnpm --filter web test` (script `"test": "vitest run"` criado no **Bloco A**). **Hoje
  `pnpm --filter web test` não é um comando válido e dá falso verde** (exit 0 sem saída) **[FATO-E]**. `pnpm test` e `pnpm test:e2e` na raiz **não existem**.

## Estado de decisões, riscos e gates

### Estado das decisões

Fonte das aprovações (P1, P3, P5, P12) e das confirmações de escopo (P7, P8, P9): instruções do Arquiteto-Chefe de 14/10/2026 (reconciliação documental, §2.3),
**não versionadas no repositório**. Onde os três documentos da `main` e esse registro divergem, vale o que está escrito aqui, com a divergência explícita.

| ID | Tema | Estado | Efeito no Bloco A |
|---|---|---|---|
| P1 | cookies e `SESSION_COOKIE_MAX_AGE_SECONDS` obrigatória, sem fallback silencioso, não superior ao TTL efetivo do refresh | **[APROV]** | Requisito de A. TTL local `7d` é **[INFO]**; demais ambientes a confirmar antes da implantação ([BLQ-DEPL]) |
| P2 | concorrência/renovação (E-P / E-A) | [PROP][PEND] — [BLQ-IMPL] B2; [BLQ-DEPL] | Nenhum: renovação fora de A |
| P3 | Node 22 (≥ 22.12) + Vitest `^5.0.3`; `engines` do monorepo inalterado | **[APROV]** | Requisito de A |
| P4 | riscos e premissas da estratégia de sessão que dependem da API | [PROP][PEND] — [BLQ-DEPL]; caminho E-A | Nenhum em A; **não** inferir resolução |
| P5 | estratégia de testes (U/I/M; sem Playwright/Testing Library sem autorização explícita) | **[APROV]** | Requisito de A |
| P6 | **sem entrada em nenhum dos três documentos da `main`**; estado não determinável por eles | [PEND] — **a esclarecer pelo Arquiteto-Chefe**; nenhuma aprovação inferida | Nenhum gate documentado de A depende dela |
| P7 | `PROJECT_STATUS.md` fora dos blocos; atualizar no encerramento da sprint | Fora do escopo de implementação — gate posterior (encerramento) | Nenhum; `PROJECT_STATUS.md` não é alterado |
| P8 | `engines`/Turbo/configuração global do monorepo | Fora do escopo; conflito `engines.node >=18` documentado, sem alterar `package.json` | Nenhum; `turbo.json` e `package.json` da raiz não são alterados |
| P9 | CI do frontend | Fora do escopo da sprint — **bloqueia prontidão para produção** ([BLQ-DEPL]) | Nenhum; critérios do web verificados localmente |
| P10 | semântica `end`/`renew` | [PROP][PEND] — bloqueia B1 (`end`) e B2 (`renew`) | Nenhum em A |
| P11 | falhas ambíguas | [PROP][PEND] — [BLQ-IMPL] B2 | Nenhum em A |
| P12 | `APP_ORIGIN` canônica; validação estrita de `Origin` antes de body/cookies/API; sem `Host`/`X-Forwarded-*` | **[APROV]** | Requisito de A (config); depois B1, B2 |
| O7 | dividir o Bloco B em B1/B2 | [PROP][PEND] — bloqueia B1 | Nenhum em A |

**[APROV]: P1, P3, P5, P12.** Renovação automática de sessão, Web Locks e rotação de refresh token **não** fazem parte do Bloco A; os riscos de rotação e de chamadas
concorrentes (RA-2, §5) e as decisões P10/P11 **permanecem explicitamente pendentes**.

### Gates de autorização (nenhum bloco está autorizado)

- **Baseline/Design Freeze:** o **merge do PR exclusivamente documental ocorreu** (PR #33, `e4f2aa5`; **[FATO-L]**, revalidado em 14/10/2026). A **aprovação explícita dos documentos como baseline pelo Arquiteto-Chefe não está registrada ⇒ PENDENTE.** **Design Freeze não declarado.**
- **Bloco A:** **P1, P3, P5 e P12 aprovadas** e **P7/P8/P9 confirmadas fora do escopo** (registro nas instruções do Arquiteto-Chefe de 14/10/2026, não versionado no repositório). **PENDENTES:** aprovação da baseline e **autorização formal do Arquiteto-Chefe** para iniciar o bloco, após auditoria. A verificação de Node (≥ 22.12) e `pnpm` 11.11.0 no Windows continua a registrar no relatório de A. TTL: referência local `7d` (604.800 s) registrada como **[INFO]**; demais ambientes a confirmar antes da implantação (ver nota de TTL).
- **Bloco B1:** depende da **conclusão e aprovação de A**, da **decisão O7** e da **aprovação de P10 para o subconjunto `end`**.
- **Bloco C:** depende da **conclusão e aprovação de A e B1**.
- **Bloco B2:** depende da **aprovação de B1**, da **decisão P2**, da **política de renovação de P10** e da **decisão P11**; **se O2 for adotada**, exige também **smoke tests de navegador para HIP-17/HIP-18**; **se E-A for adotada**, exige a **correção prévia da API** e a **reavaliação de P11**.
- **Implantação além de uso individual/desenvolvimento:** depende das **condições comuns** de segurança e operação (ADR §5.7) e da **resolução de O1b** ou de **aceite explícito, informado e documentado** do risco residual. P9 (CI do frontend, fora desta sprint) **bloqueia a prontidão para produção**.

Cada bloco, futuramente, exige **branch e PR próprios, validação documentada e aprovação explícita antes de avançar ao seguinte**. Sequência registrada, condicionada
a cada gate: **A → B1 → C → B2** (O7 pendente). Concluir uma tarefa não avança automaticamente para o bloco seguinte.

### Riscos — segurança × operação (classificação **proposta**; a final é do Arquiteto-Chefe)

| # | Categoria | Risco | [BLQ-IMPL] | [BLQ-DEPL] |
|---|---|---|---|---|
| RA-1 | segurança | rotação não atômica na API (F1/F3) | — | **sim** (multiusuário/multi-processo) |
| RA-4 | segurança | sem rate limiting visível (F9, busca não exaustiva) | — | **sim** se exposto |
| RA-5 | segurança | JWT sem consulta ao banco (F6): usuário revogado/desativado válido até o `exp` | — | avaliar |
| RA-10 | segurança | refresh token antigo possivelmente válido e sem dono (falhas ambíguas/logout indeterminado) | — | documentar |
| RA-13 | segurança | política de origem depende de `APP_ORIGIN` correta e de `Origin` nos navegadores | **A** (P12) | **sim** |
| RA-14 | segurança | O2 depende de HIP-17/18 não verificadas; se falhar, RA-2 permanece integral | **B2** (se O2) | **sim** |
| RA-15 | segurança | Proxy só verifica presença do cookie: cookie obsoleto/forjado passa a navegação; a API decide | — | documentar |
| **RA-2** | **operação** (efeito de segurança: revogação global) | chegada tardia/abas/processos/instâncias ⇒ revogação global; impacto no §5.3 | **B2**, até a decisão sobre P2 | **sim** (até O1b ou aceite informado) |
| RA-3 | operação | `204` do logout não prova revogação | — | documentar |
| RA-6 | operação | web fora do CI (F17) | — | **sim** |
| RA-7 | operação | `engines >=18` × Next 16/Vitest | — | avaliar |
| RA-8 | operação | `PROJECT_STATUS.md` ("Frontend ✅ Operacional") diverge do scaffold | — | — |
| RA-9 | operação | verificações só em Linux/Node 22/scaffold | — | **sim** |
| RA-11 | operação | envio automático depende de JavaScript | — | documentar |
| RA-12 | operação | `Max-Age` de `cos_renewed` heurístico (HIP-12) | calibrar (B2) | — |
| RA-16 | operação | P11/B-a desloga também em quedas transitórias da API | — | avaliar |

### Hipóteses abertas (nenhuma verificada)

HIP-1 deploy indefinido · HIP-2 `Map` e recarga de módulo em dev · HIP-3 descarte do Router Cache após a `303` do logout · HIP-5 `cause.code` do `fetch`
real · HIP-6 `Secure` em `http://localhost`/Windows · HIP-7 comportamento real de proxy reverso · HIP-9 `proxy()` invocável diretamente em teste · HIP-11
resposta do Next a métodos não exportados · HIP-12 `Max-Age` de `cos_renewed` · HIP-13 envio único do formulário (dev/prod) · HIP-14
prefetch/`redirect()` ao `continue` · HIP-15 `Origin` em `POST` pelos navegadores · HIP-16 `serverActions.allowedOrigins` · HIP-17 suporte/semântica da
Web Locks API · HIP-18 liberação do bloqueio só após os cookies da `303` · HIP-19 janela ≈ RTT e ausência de reenvio de `POST` · HIP-20 limites de tempo do
bloqueio · HIP-21 proporção de `5xx` anteriores à rotação · HIP-22 Windows, `main` protegida, diretório de patches e `docker compose` v2 (**[INFO]**) ·
HIP-23 exceção em `register` impede a subida · HIP-24 efeito de O1a sobre a requisição "perdedora" (depende do desenho na API).

## Consequences

- Positivas (se aprovadas): nenhuma operação que muda a sessão responde a `GET`; falhas ambíguas não geram reuso de token; destino preservado;
  fluxo sem laço; logout sem afirmações indevidas; nenhuma alteração na API; divergência de configuração de cookie nunca abre brecha.
- Negativas: etapa intermediária por encerramento/renovação (dependência de JavaScript, com botão de contingência); em falha ambígua a pessoa
  entra de novo; revogação remota nunca confirmável (F4); single-flight cobre só um processo (§5.1); token antigo órfão possível (RA-10); variáveis
  obrigatórias novas (`API_BASE_URL`, `SESSION_COOKIE_MAX_AGE_SECONDS`, `APP_ORIGIN`); `POST` de sessão vindo de origem diferente da configurada é
  recusado; em B1/C (sem renovação) a sessão dura até o access expirar (TTL efetivo desconhecido) e exige novo login.
- Operacionais: web não é validado em CI (F17); implantação além de uso individual/desenvolvimento permanece bloqueada (§5.7).

## Future Evolution

- **Correção na API (O1a/O1b):** exige autorização arquitetural específica e **ADR de segurança própria** (tamanho da janela de tolerância, o que
  é devolvido no replay, auditoria, escopo por cliente); se aprovada, **P11 é reavaliada** (§6).
- Web no CI (P9), `engines`/Turbo (P8), correção de `PROJECT_STATUS.md` (P7), rate limiting do login (RA-4), sessão no servidor com armazenamento
  compartilhado (O3) — itens de **outras** decisões/sprints, **fora** do escopo da SPR-015.

## Fora de escopo

`apps/api` (incl. rotação atômica, idempotência, expiração do refresh), `turbo.json`, `package.json` raiz, `.github/workflows/ci.yml`,
`PROJECT_STATUS.md` (até o encerramento formal), registro de usuário, `Campaign`/`Content`/`Publication`, rate limiting, logout global, Playwright,
Testing Library, serviços externos, cache pós-conclusão de tokens (sem análise de segurança) e configuração de deploy/proxy reverso.

## Aprovação

**Decisões individuais:** P1, P3, P5 e P12 aprovadas; P7, P8 e P9 confirmadas fora do escopo do Bloco A (fonte: instruções do Arquiteto-Chefe de 14/10/2026, não
versionadas). **Demais decisões e O7: pendentes.**

**Revisão 8 como baseline / Design Freeze:** **aprovação não registrada; Design Freeze não declarado.** O merge do PR #33 integrou os documentos na `main`, mas **não**
é aprovação do conjunto. **Autorização para implementar o Bloco A: não concedida.** Nenhum bloco está autorizado; nada aqui autoriza implementação, branch, commit, patch
ou PR de código. Alterações futuras seguem o fluxo **[INFO]**: branch → PR → merge na `main` protegida; patches `.patch` em `C:\Users\marceloferreira\Downloads`,
aplicados pelo Arquiteto-Chefe. **Parecer pendente do Arquiteto-Chefe:** aprovar estes documentos como baseline (após esta reconciliação), solicitar ajustes ou rejeitar
— e, em decisão separada, autorizar ou não o início do Bloco A — **sem que isso decida, por si, P2, P4, P6, P10, P11 ou O7**.
