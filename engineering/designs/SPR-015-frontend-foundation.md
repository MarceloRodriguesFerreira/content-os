# SPR-015 — Frontend Foundation (Design Doc)

Status: `Proposed` (status de arquivo) — revisão 8, **integrada à `main`** pelo PR #33 (merge `e4f2aa5`) e reconciliada em 14/10/2026. **Aprovação da revisão 8 como
baseline: não registrada (PENDENTE). Design Freeze: não declarado.** **Em 14/10/2026 nenhum bloco estava autorizado** (histórico; ver estado vigente abaixo); a autorização formal do Bloco A dependia de auditoria e de
decisão explícita do Arquiteto-Chefe. **Decisões individuais aprovadas em 14/10/2026: P1, P3, P5 e P12** (O7 e P10 `end` em 21/10/2026); P7, P8 e P9 confirmadas fora do escopo do Bloco A (fonte: instruções do
Arquiteto-Chefe de 14/10/2026, não versionadas no repositório). A tabela completa de estados está na ADR-014 ("Estado das decisões"). Aprovação de decisão individual,
aprovação da revisão 8, integração na `main`, autorização do Bloco A e aprovação do resultado do Bloco A são **estados distintos**.

> **Estado vigente em 21/10/2026** (data do **registro**; a **data original** das decisões é **desconhecida**; fonte: instruções do Arquiteto-Chefe, não versionadas). O texto acima e as seções marcadas
> "histórico" descrevem 14/10/2026; **onde divergem, vale este bloco**. **Bloco A:** concluído, integrado (PR #35, `fe58c24`, **[FATO-L]**) e com **resultado técnico aprovado** pelo Arquiteto-Chefe com base em execução
> **local relatada** em 21/10/2026 (183 testes aprovados; lint sem erros exibidos; `check-types` com saída 0; build bem-sucedido), **não** CI pós-merge. **O7 aprovada; P10 aprovada só para `end`.** **Bloco B1:** autorizado de
> forma condicionada (pré-condições na ADR-014); código não iniciado. **B2:** bloqueado, fora do B1. **P2, P4, P6 e P11:** pendentes. **Aprovação da revisão 8 como baseline: PENDENTE; Design Freeze: não declarado** (a revisão 8 é
> a referência técnica para o B1, sem aprovação automática como baseline). Registro completo: seção "Registro de decisões posteriores à revisão 8" da ADR-014.
>
> **Atualização de 22/10/2026** (data do **registro**; a **data original** das decisões é **desconhecida**; fonte: instruções do Arquiteto-Chefe, não versionadas). O Arquiteto-Chefe decidiu: lista oficial do B1 = **25 identificadores: 22 critérios específicos (os 21 anteriormente listados + AC-33.1) + 3 transversais (AC-36, AC-46, AC-47)**; **AC-33** cobre o log do logout e **AC-33.1**, critério independente com verificação própria, o log do `end`; nova redação do **AC-36**; **AC-46** exige `test`, `lint`, `check-types` e `build`; **AC-47** exige identificação, justificativa e autorização explícita de toda alteração em arquivo do Bloco A; **AC-40** com alteração aditiva mínima autorizada em `messages.ts` e `messages.test.ts` (mensagem "Sua sessão terminou. Entre novamente."), **sem autorizar outras alterações no Bloco A**. **B1 não está liberado:** a autorização segue condicionada à integração desse registro na `main` e à validação do estado-base no Windows. Baseline pendente, Design Freeze não declarado, P2, P4, P6 e P11 pendentes. Registro completo: ADR-014, seção "Registro de decisões posteriores à revisão 8" (D-8 a D-14).

Decisões de arquitetura: `engineering/adr/ADR-014-frontend-authentication-and-session.md` (mesmo estado documental; ver Status) — contém a legenda
de estados, os fatos F1–F27, as hipóteses HIP-1…24, os riscos RA-* e a comparação P2. Backlog: `engineering/backlog/SPR-015.md` (proposta).

**Legenda (idêntica à da ADR):** **[FATO-L]** verificado por leitura · **[FATO-E]** verificado por execução · **[INFO]** informado, não verificado ·
**[HIP-n]** hipótese · **[PROP]** proposta técnica do Claude · **[PEND]** aguarda o Arquiteto-Chefe · **[APROV]** aprovada (**P1, P3, P5, P12**) ·
**[BLQ-IMPL]** bloqueia implementação · **[BLQ-DEPL]** bloqueia implantação. Toda decisão deste documento é **[PROP][PEND]**, exceto P1, P3, P5 e P12 (**[APROV]**, regra central).

## Contexto

`apps/web` é o scaffold do `create-next-app` (`app/layout.tsx`, `app/page.tsx`, CSS padrão); sem `proxy`, sem env, sem script `test` **[FATO-L]**.
`PROJECT_STATUS.md` afirma "Frontend ✅ Operacional" — **divergente** da realidade; este documento descreve o estado real e **não corrige**
`PROJECT_STATUS.md` (P7). `ADR-014` e documentos da SPR-015 **não existiam em `main`** à época da revisão 8 (`main` = `3480229`) **[FATO-L]**; **passaram a existir** com o merge do PR #33
(`e4f2aa5`, revalidado em 14/10/2026) **[FATO-L]**. A revisão 2 reescreveu uma versão anterior indisponível; as revisões 3 a 8 derivam da anterior; **não há evidência** de
que decisões anteriores à revisão 2 tenham sido preservadas. **Nenhum código e nenhum teste foram executados na revisão 8.**

**Contexto de execução — [INFO], não verificado:** ambiente **Windows**; `main` **protegida** (branch → PR → merge); patches em
`C:\Users\marceloferreira\Downloads`; Docker Compose em `.\docker\docker-compose.yml`; `apps/api` não pode ser alterada sem autorização
arquitetural específica. **Confirmado por leitura, nada executado [FATO-L]:** o arquivo de Compose existe e define o serviço `postgres`; a raiz
**não** tem `test` nem `test:e2e` (`pnpm test:e2e` na raiz **não existe**); o `test:e2e` oficial é `pnpm --filter api test:e2e`; o web **não** tem
script `test`; o `lint` da API usa `--fix`.

## Objetivo

Uma pessoa autenticada consegue entrar (`/login`), ver seus projetos (`/projects`), criar um projeto e sair, com falhas tratadas conforme a
ADR-014, sem alterar `apps/api`. **A renovação de token é isolada no Bloco B2 e depende de decisões pendentes (P2, P10, P11).**

## Limites da sprint

**Dentro (se aprovado):** `/login`, `/projects` (lista + criação), `GET /v1/users/me`, logout, encerramento de sessão (`end`), `proxy.ts`, DAL,
validação de origem, Vitest em `apps/web`, `apps/web/.env.example`; e, **somente no Bloco B2 e sob decisão do Arquiteto-Chefe**, a renovação
(etapa intermediária + `POST renew`).
**Fora:** registro de usuário, `Campaign`/`Content`/`Publication`, editar/arquivar `Project`, rate limiting, qualquer alteração em `apps/api`,
`turbo.json`, `package.json` raiz, `.github/workflows/ci.yml`, `PROJECT_STATUS.md` (até o encerramento), Playwright, Testing Library, bibliotecas
de sessão/UI novas, serviços externos, deploy/proxy reverso.

## Contratos da API consumidos — [FATO-L]

| Uso | Chamada | Sucesso | Erros relevantes |
|---|---|---|---|
| Login | `POST /v1/auth/login` `{email, password}` | `200` `data:{accessToken, refreshToken}` | `401`; `400` |
| Renovar | `POST /v1/auth/refresh` `{refreshToken}` | `200` `data:{accessToken, refreshToken}` | `401` (inválido/expirado/reusado → todas as sessões revogadas) |
| Logout | `POST /v1/auth/logout` Bearer + `{refreshToken}` | `204` sem corpo (**não** prova revogação) | `401` access ausente/expirado |
| Pessoa | `GET /v1/users/me` Bearer | `200` `data: UserResponseDto` | `401` |
| Listar | `GET /v1/projects?page&limit&status` Bearer | `200` `data:{items, meta}` | `401` |
| Criar | `POST /v1/projects` Bearer `{name, description?}` | `201` `data: ProjectResponseDto` | `400` (`message[]`), `401` |

Envelopes: [F8]. Corpo fora desse formato é `unavailable` (em dados) ou ambíguo (na renovação, ADR §6).

## Rotas previstas — [PROP][PEND]

| Rota | Bloco | Método | Efeitos | Observação |
|---|---|---|---|---|
| `/login` | B1 | GET (página) + Server Action | Action grava cookies | Proxy não redireciona |
| `/projects` | C | GET (página) + Server Action de criação | leitura via DAL | `401` ⇒ `end` (C) / renovação ou `end` (com B2) |
| `/session/continue?mode&next` | B1 (`end`); B2 (`renew`, `unavailable`) | **GET** | **nenhum** (sem cookies, sem API) | `end`/`renew`: envio único automático do formulário `POST`; `unavailable`: sem envio automático; *(condicional a O2, **não aprovada**, só B2: bloqueio entre abas antes do envio em `renew`)* |
| `/api/session/end` | B1 | **POST apenas** | remove cookies; **não** chama a API | origem validada (ADR §8); `303` `/login?reason=session` |
| `/api/session/logout` | B1 (sem renovação); B2 (com renovação) | **POST apenas** | chama a API de logout + remove cookies | origem validada; `303` `/login`; mensagem A/B |
| `/api/session/renew` | **B2** | **POST apenas** | rotação de token + `Set-Cookie` | origem validada **antes de agir**; `303`; `no-store` |

**Semântica (P10):** `end` encerra a sessão **local** sem chamar a API; `renew` tenta renovar via `POST`; `unavailable` só informa e oferece nova tentativa
manual. Nada que altera sessão responde a `GET`.

## Estratégia de autorização — [PROP][PEND]

O Proxy verifica **só a presença** de `cos_access` (navegação otimista); **não** é autenticação. Todo dado protegido passa pelo DAL, que envia o
`Bearer` e deixa a **API decidir**; `401` ⇒ `end` (B1/C) ou renovação/`end` (B2); `403` ⇒ "sem permissão" sem tocar cookies; `5xx`/rede ⇒ "indisponível" sem
tocar cookies. Detalhes e limites do Proxy: ADR §3. Validação de origem dos `POST` de sessão: ADR §8. **Fronteiras** (navegador, Proxy, servidor
Next, DAL, API): ADR §1 — a API **não** é alterada.

## Configuração — P1 e P12 [APROV] (regra central); detalhamento [PROP]

| Variável (nome proposto) | Regra |
|---|---|
| `API_BASE_URL` | obrigatória, sem padrão, só servidor; URL absoluta `http`/`https` sem credenciais; exemplo local em `.env.example` |
| `SESSION_COOKIE_MAX_AGE_SECONDS` | obrigatória, sem padrão silencioso, inteiro positivo; **operacionalmente não superior** ao `JWT_REFRESH_TTL` **efetivo** da API do mesmo ambiente (conferência humana registrada; os defaults `15m`/`7d` **não** são presumidos como efetivos — ADR F7) |
| `APP_ORIGIN` | obrigatória, sem padrão, só servidor; origem `http`/`https` pura (sem path/query/userinfo) = origem **pública** vista pelo navegador; usada na validação de origem dos `POST` de sessão (ADR §8); exemplo local `http://localhost:3000` |

**Aprovado:** P1 — `SESSION_COOKIE_MAX_AGE_SECONDS` obrigatória, sem fallback silencioso, não superior ao TTL efetivo do refresh token da API; P12 — `APP_ORIGIN` como origem canônica e validação estrita de `Origin` antes de ler body, tocar cookies ou chamar a API, sem substituição por `Host`/`X-Forwarded-*`. O restante desta seção (`instrumentation.ts`, formato de erro, estrutura) segue **[PROP][PEND]**.

**Nota de TTL (reconciliação de 14/10/2026).** **[FATO-L]** `apps/api/src/config/configuration.ts` define `refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d'`; `AuthService.calculateRefreshExpiry()` calcula a expiração persistida do refresh token a partir desse valor, via `parseTtlToMs`, que aceita `ms`, `s`, `m`, `h` e `d` e lança erro quando o formato não corresponde; `env.validation.ts` exige apenas que `JWT_REFRESH_TTL` seja string não vazia, **sem validar o formato da duração no bootstrap** (o formato inválido só é detectado quando o parser executa). **[INFO]** (saída de PowerShell fornecida pelo responsável técnico; `apps/api/.env` é ignorado pelo Git e **não** foi lido nesta reconciliação): o `.env` local tinha `JWT_REFRESH_TTL=7d`, equivalente a **604.800 segundos** — referência compatível para o ambiente local naquele momento. Isso **não** prova o valor efetivo de staging/produção nem exclui sobrescrita por variável de ambiente externa: a configuração dos demais ambientes **ainda precisa ser confirmada antes da implantação**. `SESSION_COOKIE_MAX_AGE_SECONDS` é obrigatório e **não pode exceder** o TTL efetivo do refresh token do ambiente correspondente; `604800` **não** é garantia universal. Nenhuma alteração em `apps/api` (inclusive no parser ou na validação de ambiente) é feita ou autorizada por esta reconciliação.

**Validação:** função pura `loadConfig` na primeira utilização; **se aprovado e verificado**, também na inicialização via `instrumentation.ts` (`register`
roda uma vez antes de o servidor atender — **[FATO-L]**; se uma exceção ali impede a subida é **HIP-23**). Valor ausente/inválido ⇒ falha fechada
(erro genérico `500`, motivo só no log). **Limite:** o frontend **não** consegue verificar o TTL da API nem a validade do token; o `Max-Age` é dica de
ciclo de vida, e a validade real é a resposta `401` da API. `apps/web/.gitignore` ignora `.env*` **[FATO-E]**: versionar `apps/web/.env.example`
exige a exceção `!.env.example` nesse arquivo.

## Estrutura prevista (previsão, não contrato)

```
apps/web/
  proxy.ts  vitest.config.ts  .env.example
  app/
    layout.tsx  page.tsx                  # page.tsx: redirect para /projects
    login/page.tsx                        # + Server Action fina
    projects/page.tsx
    session/continue/page.tsx             # GET sem efeitos + componente cliente de envio único (B1: modo end; B2: renew/unavailable)
    api/session/renew/route.ts            # só POST — somente B2
    api/session/end/route.ts              # só POST
    api/session/logout/route.ts           # só POST
  lib/server/
    config.ts  cookies.ts  api-client.ts (DAL)  session.ts
    safe-next.ts  continue-model.ts  origin-check.ts  login.ts  end.ts  logout.ts  messages.ts      # A/B1
    single-flight.ts  renew.ts  classify.ts  (lock-policy.ts se O2)                                   # B2
  lib/api/envelope.ts
  **/*.test.ts                            # colocalizados
```

Lógica em funções puras com o armazenamento de cookies **injetado**; handlers/Server Actions/página são casca fina.

## Fluxos

Normativos na ADR-014: cookies e configuração (§2), Proxy e DAL (§3), `end`/`renew` e anti-laço (§4), concorrência (§5), falhas ambíguas (§6),
logout com quatro dimensões e revogação **nunca afirmada** (§7), origem (§8). Login: Server Action valida campos → `POST /v1/auth/login` → grava
`cos_access` (`Path=/`) e `cos_refresh` (`Path=/api/session`) com o `Max-Age` configurado → redireciona ao `next` validado ou a `/projects`.

## Estratégia de testes — P3 e P5 [APROV] (regra central); detalhamento [PROP]

### Níveis

- **U — unitário:** Vitest puro, sem rede, sem Next em execução.
- **I — integração com API simulada:** Vitest com servidor `node:http` local (porta efêmera) que **simula a API**, inclusive estado de rotação/reuso
  do refresh token, lentidão, conexão recusada, soquete destruído após receber a requisição e respostas truncadas; invoca diretamente funções,
  Route Handlers (`Request`/`NextRequest`) e o DAL.
- **M — smoke manual de navegador contra a API real** + Postgres do Compose. Evidência: roteiro preenchido e capturas/observações no relatório do bloco.

### Declarações de alcance (obrigatórias)

1. Testes **U e I não comprovam** o comportamento real do Next.js (Proxy, Route Handlers, página `continue`, `redirect()` em streaming, prefetch,
   Router Cache) **nem do navegador** (jar de cookies, `Path`, `Secure`, `303` após `POST`, envio automático do formulário, Web Locks).
2. Os cenários **ambíguos** da renovação e do logout só são exercitados **na API simulada**; a API real não oferece como provocá-los de forma
   controlada. A simulação prova o **comportamento do nosso código dado o modelo de API que assumimos**, não o da API real **em falhas
   pós-rotação**.
3. Os experimentos já feitos (revisão 3 e anteriores) foram em **Linux descartável**, Node 22.22.2, sobre o **scaffold**; **não comprovam** Windows,
   Node 20 nem o `next build` do código final.
4. Os critérios por comando abaixo são **alvos**: nenhum `check-types`/`build`/`test` do código da SPR-015 existe ainda.
5. Nenhum resultado de teste da feature existe; **nada foi executado na revisão 8**.

### Estado das evidências (separação obrigatória)

**A. Já executado — revisões anteriores; Linux descartável, Node 22.22.2, pnpm 11.11.0; NÃO repetido na revisão 8 [FATO-E]:** instalação do workspace
`web`; `vitest@5.0.3` e `4.1.11` rodando **5 testes de exemplo** (TS ESM, `NextRequest`/`NextResponse` com atributos de `Set-Cookie`, `fetch` mockado,
single-flight com `Promise.all`); com `5.0.3` e um script `test` de exemplo: `pnpm --filter web test`, `check-types`, `lint`, `build` com exit 0 (app =
**scaffold**); `pnpm --filter web test` sem script ⇒ exit 0 sem saída; sem arquivos de teste ⇒ exit 1; `turbo run test` ⇒ task inexistente; `git
check-ignore` de `apps/web/.env.example`. **Verificado na revisão 5 (plataforma):** semântica de `URL`/`Headers` (ADR, evidências).
**Limites:** não é Windows, não é Node 20, não é o código da SPR-015, não é CI.

**B. Lido na revisão 8 [FATO-L]:** `main`, scripts, Docker Compose, `.env.example`, `CONTRIBUTING.md`, `ci.yml`, padrões de ADR/Design Doc/backlog,
documentação instalada do Next sobre `instrumentation`; **nada executado**.

**C. Proposto, não executado:** toda a matriz de critérios (AC-01…47 e variantes), os Blocos A, B1, C e B2 e os comandos de verificação no Windows.

**D. Não verificado:** Windows; Node 20; `next build`/`check-types` do código da SPR-015; execução do Proxy, dos Route Handlers e da página
`continue` no Next; resposta do Next a métodos não exportados; `cause.code` do `fetch` real; `Secure` em `http://localhost`; proxy reverso; `Origin`
em `POST` pelos navegadores; envio único do formulário; Web Locks; `docker compose` v2 na máquina do Arquiteto-Chefe; **API real em falhas
pós-rotação**; exceção em `register()`; CI (não executa o web).

### Como o script de testes é introduzido

O monorepo roda checagens por pacote com `pnpm --filter <pkg> <script>` (CI e `ENGINEERING_GUIDE.md`) **[FATO-L]**; `turbo.json` e a raiz não têm
`test`. **Proposta:** o **Bloco A** adiciona a `apps/web/package.json` a devDependency `vitest` (`^5.0.3`, travada pelo `pnpm-lock.yaml`) e o script
`"test": "vitest run"`, mais `vitest.config.ts`; **nada da raiz ou do Turborepo é tocado**. **Antes do Bloco A (estado em 14/10/2026), `pnpm --filter web test` não
existia** e saía com exit 0 sem saída (falso verde **[FATO-E]**; o script passou a existir com o merge da PR #35, **[FATO-L]**): por isso o critério exige **contagem de testes**. **`pnpm test:e2e` na raiz não é um comando
válido**; o `test:e2e` oficial é `pnpm --filter api test:e2e` (a raiz tem o alias `pnpm api …`, **não executado**).

### Compatibilidade — P3 [APROV]

| Item | Exigência | Estado |
|---|---|---|
| Vitest 5.0.3 (proposto) | Node `^22.12 \|\| ^24 \|\| >=26` (23.x e 25.x **não**) | **[FATO-L]** (registro npm); executado só em Node 22 sobre o scaffold **[FATO-E]** |
| Vitest 4.1.11 (alternativa; **não adotada** — P3 aprova `^5.0.3`) | Node `^20 \|\| ^22 \|\| >=24` | **[FATO-L]**; executado só em Node 22 **[FATO-E]** |
| Next 16.2.0 | Node `>=20.9.0` | **[FATO-L]** |
| CI atual | Node 22 | **[FATO-L]** |
| Raiz `engines.node` | `>=18` — conflita com Next 16.2.0 e Vitest | **[FATO-L]**; documentado, **sem alterar** `package.json` (P8) |

**Aprovado (P3):** Node 22 (**versão mínima 22.12**) + Vitest `^5.0.3`; `engines` do monorepo **não** é alterado (P8). Ambiente abaixo disso impede iniciar o Bloco A (pré-requisito técnico). Verificação no
Windows (PowerShell/cmd), a registrar no relatório do Bloco A — **comandos propostos, não executados**:

```
node --version                               (22.12+ em 22.x; ou 24.x; ou >=26)
pnpm --version                               (11.11.0, campo packageManager)
pnpm install --frozen-lockfile
pnpm --filter web exec vitest --version      (vitest/5.0.3 ...)
pnpm --filter web test                       (só existirá após o Bloco A)
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
```

Falha no Windows ⇒ o bloco não é entregue como concluído; a falha é reportada. **Windows, Node 20, Next 16 final e CI permanecem não verificados** até
essas execuções.

### Critérios verificáveis por comando (alvos) e evidências exigidas

| Comando | Existe hoje? | Critério |
|---|---|---|
| `pnpm --filter web lint` | sim | exit 0, zero avisos |
| `pnpm --filter web check-types` | sim | exit 0; inclui `vitest.config.ts` e `*.test.ts` |
| `pnpm --filter web build` | sim | exit 0 |
| `pnpm --filter web test` | **não em 14/10/2026 — criado no Bloco A** (existe desde a PR #35, **[FATO-L]**) | script presente; exit 0; `Test Files N passed` com N ≥ 1 e 0 failed; "No test files found" = falha |
| Escopo | — | `git diff --name-only origin/main...HEAD` sem `apps/api/`, `turbo.json`, `package.json` (raiz), `.github/workflows/ci.yml`; `PROJECT_STATUS.md` só no encerramento |
| Regressão da API (encerramento) | sim | `pnpm --filter api test`, `build`, `test:e2e`; `lint` usa `--fix` — conferir `git status` limpo; **não é executado nesta tarefa** |

**Evidências exigidas por bloco:** saída dos comandos acima, contagem de testes, lista de critérios atendidos e dos **não verificados**, resultado do smoke
(quando aplicável) e declaração do que **não** foi executado. O CI não executa o web (**[FATO-L]**): critérios verificados **localmente** (P9).

## Matriz de critérios de aceite × testes (revisão 8)

Todos os critérios são **[PROP]**; **nenhum foi executado** (texto de 14/10/2026; os critérios do B1 seguem **[PROP]**, sem execução; para o Bloco A há execução local relatada em 21/10/2026). U / I / M como acima. **Bloco**: A, B1 (sessão sem renovação), C (telas), B2 (renovação). "Arquivo" é previsão. A coluna **Não prova**
lembra o limite do nível. Variantes `NN.1` existem quando o critério muda entre B1/C e B2.

**Categorias dos critérios do B1 (decisão de 22/10/2026, ADR-014 D-8):** **22 específicos** — AC-06, 07, 08, 10, 11, 12, 15.8, 15.9, 15.11, 27.1, 28.1, 29, 30, 31, 33, 33.1, 34, 34.1, 40, 41, 42, 44 — e **3 transversais** —
AC-36, 46 e 47, marcados "(transversal)" na coluna **Bloco** e válidos para todos os blocos. Total oficial: **25 identificadores**. O **AC-33.1** (log do `end`) é critério específico **independente** do AC-33 (log do logout),
com verificação própria (`end.test.ts`).

| AC | Bloco | Critério verificável | Nível | Arquivo | Não prova |
|---|---|---|---|---|---|
| 01 | A | `API_BASE_URL` ausente/inválida ⇒ falha fechada | U | `config.test.ts` | — |
| 02 | A | `SESSION_COOKIE_MAX_AGE_SECONDS` ausente/não inteiro positivo ⇒ falha fechada; válido ⇒ usado nos cookies de sessão | U | `config.test.ts` | — |
| 02.1 | A *(condicional: só se P1 e a inicialização via `instrumentation.ts` forem aprovadas)* | `loadConfig` é chamada em `register()` na inicialização; configuração inválida ⇒ falha fechada. Teste unitário da função; **se uma exceção em `register` impede a subida do servidor é HIP-23 (não verificada)** | U, M | `config.test.ts`; relatório | comportamento real do Next na subida |
| 03 | A | `cos_access` (`Path=/`) e `cos_refresh` (`Path=/api/session`): `HttpOnly`, `SameSite=Lax`, sem `Domain`, `Max-Age` configurado; `Secure` só em production | U | `cookies.test.ts` | aceitação real pelo navegador |
| 03.1 | B2 | `cos_renewed` (`Path=/`), `HttpOnly`, `SameSite=Lax`, `Max-Age` curto | U | `cookies.test.ts` | idem |
| 04 | A | Remoção reemite `cos_access` e `cos_refresh` com o mesmo `Path`, `Max-Age=0`, valor vazio | U | `cookies.test.ts` | remoção efetiva no navegador (AC-44) |
| 04.1 | B2 | A remoção inclui `cos_renewed` | U | `cookies.test.ts` | idem |
| 05 | A | Parsing: sucesso `200/201`, erro (`message` string e array), `204`; corpo ilegível/forma inesperada ⇒ `unavailable`/ambíguo, sem expor o corpo | U | `envelope.test.ts` | — |
| 06 | B1 | Login `200`: cookies gravados; redirect ao `next` válido ou `/projects` | U, I | `login.test.ts` | — |
| 07 | B1 | Login `401` ⇒ "E-mail ou senha inválidos."; `400` ⇒ "Dados inválidos."; sem cookies | U, I | `login.test.ts` | — |
| 08 | B1 | API indisponível no login (recusada/timeout/`5xx`) ⇒ "Serviço indisponível. Tente novamente.", sem cookies, e-mail preservado, senha não | I | `login.int.test.ts` | — |
| 09 | A | `safe-next` rejeita `//x`, `/\x`, `https://x`, `javascript:`, controle, `/api/session/*`, `/session/*`, `/login`; aceita `/projects?page=2`; `reason`/`mode` só de lista fechada | U | `safe-next.test.ts` | — |
| 10 | B1 | Modelo `continue-model` com `mode=end`: `mode` fora da lista ⇒ erro neutro; envio automático **único** | U | `continue-model.test.ts` | renderização real |
| 10.1 | B2 | `continue-model` com `renew` (`next` inválido ⇒ `/projects`) e `unavailable` (**sem** envio automático) | U | `continue-model.test.ts` | idem |
| 11 | B1, B2 | Página `continue` **sem efeitos** (revisão estática): `git grep -nE --untracked "cookies\(\|API_BASE_URL\|Set-Cookie" -- apps/web/app/session` sem ocorrências (comando **proposto**, não executado) | U (revisão) | relatório do bloco | execução real |
| 12 | B1 | Handlers `end` e `logout` exportam **somente** `POST` | U | `routes.test.ts` | resposta do Next a métodos não exportados [HIP-11] (M: AC-42) |
| 12.1 | B2 | Handler `renew` exporta **somente** `POST` | U | `routes.test.ts` | idem |
| 13 | B2 | `POST renew` válido: **1** chamada à API; **`303`** (não `307`, F20) com `Location` = `next` validado; `Set-Cookie` dos três cookies conforme AC-03/03.1 com os **novos** tokens; `Cache-Control: no-store` | I | `renew.int.test.ts` | `Set-Cookie`/`303` no navegador (AC-44.1) |
| 14 | B2 | `POST renew` sem `cos_refresh`: **0** chamadas à API; cookies removidos; `303` `/login?reason=session` | I | `renew.int.test.ts` | — |
| 15.1 | A | **Origem válida:** `Origin` idêntico (forma canônica) à `APP_ORIGIN` normalizada ⇒ aceita (inclui `http://localhost:3000`) | U | `origin-check.test.ts` | que o navegador envie `Origin` (HIP-15) |
| 15.2 | A | **Ausente:** sem `Origin` ⇒ recusa | U | `origin-check.test.ts` | — |
| 15.3 | A | **Inválida/não interpretável:** `null`, vazio, texto livre, múltiplos valores, não canônica (path, barra final, userinfo, maiúsculas, espaços) ⇒ recusa | U | `origin-check.test.ts` | — |
| 15.4 | A | **Divergente:** esquema (`http`×`https`), porta (`:3001`), host, subdomínio ⇒ recusa; porta padrão ≡ sem porta | U | `origin-check.test.ts` | — |
| 15.5 | A | **Esquemas não-http(s)** (`file:`, `chrome-extension:`, `data:`; origem opaca `"null"`) ⇒ recusa | U | `origin-check.test.ts` | — |
| 15.6 | A | `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`, `Forwarded` forjados ou coincidentes **não** alteram o resultado (decide só `APP_ORIGIN`) | U | `origin-check.test.ts` | **proxy real** (HIP-7): prova só que nosso código não os lê |
| 15.7 | A | `APP_ORIGIN` ausente/inválida/não-http(s)/com path ⇒ falha fechada; nenhuma ação de sessão | U | `config.test.ts` | — |
| 15.8 | B1 | Falha de origem em `end` e `logout`: `403`, **0** chamadas à API, **sem** `Set-Cookie` (nem de remoção, mesmo sem `cos_refresh`), `no-store`, log só com categoria; checagem **antes** de ler corpo/cookies | I | `origin.int.test.ts` | processamento real pelo Next |
| 15.8.1 | B2 | Idem para `renew` | I | `origin.int.test.ts` | idem |
| 15.9 | B1, B2 | Origem válida ⇒ fluxo normal segue (`end`/`logout` em B1; `renew` em B2) | I | `origin.int.test.ts` | — |
| 15.10 | M (condicional a existir proxy reverso) | Atrás de proxy reverso real: `APP_ORIGIN` = origem pública; formulário funciona; `POST` de outra origem é recusado. **Sem ambiente de deploy: não verificável hoje** | M | relatório | — |
| 15.11 | B1 | DevTools mostra `Origin` no `POST` do formulário same-origin; acesso por `127.0.0.1` (origem diferente da configurada) é recusado com `403` [HIP-15] | M | relatório | outros navegadores/extensões |
| 16 | B2 | Preservação de destino: `next=/projects?page=2` chega intacto ao `Location` após a renovação | I | `renew.int.test.ts` | — |
| 17 | B2 | **N — não enviada** (recusada, DNS, timeout de conexão): API simulada registra **0** requisições; cookies **mantidos**; `Location` `/session/continue?mode=unavailable&next=…` | I | `renew.int.test.ts` | `cause.code` do `fetch` real [HIP-5] |
| 18 | B2 | **R — rejeição conclusiva** (`400/401/403/404` com corpo F8): cookies removidos; `/login?reason=session`; 1 requisição | I | `renew.int.test.ts` | — |
| 19 | B2 | **A1 — `5xx`** (`500/502/503/504`, com e sem corpo F8): cookies removidos; `/login?reason=renewal`; **1** requisição, **sem** nova tentativa | I | `renew.int.test.ts` | posição real da falha em relação à rotação |
| 20 | B2 | **A2 — timeout/soquete destruído após o envio:** cookies removidos; `/login?reason=renewal`; 1 requisição | I | `renew.int.test.ts` | idem |
| 21 | B2 | **A3 — `2xx` ilegível/truncado/sem `refreshToken`:** cookies removidos; `/login?reason=renewal`; 1 requisição | I | `renew.int.test.ts` | idem |
| 22 | B2 | **A4 — erro de rede não classificado** ⇒ ambíguo (cookies removidos; `renewal`) | U | `classify.test.ts` | — |
| 23 | B2 | **Falha após possível rotação:** API simulada rotaciona e então falha (`500`/soquete destruído); o web remove cookies e **não** reapresenta o token antigo (0 segunda requisição) | I | `renew.int.test.ts` | que a API real rotacione antes de falhar |
| 24 | B2 | **Duas renovações simultâneas** (3 `POST`, mesmo cookie, mesmo processo): **1** chamada à API; 3 respostas equivalentes | I | `renew.int.test.ts` | multi-processo/instância |
| 25 | B2 | Entrada do single-flight removida após **sucesso e falha** | I | `single-flight.test.ts` | — |
| 26 | B2 | **Chegada tardia:** `POST` sequencial com o cookie antigo ⇒ API simulada responde `401` e revoga a família ⇒ web remove cookies. **Documenta a limitação; não demonstra proteção** | I | `renew.int.test.ts` | que a API real se comporte assim (F2/F3 por leitura de código) |
| 27 | B2 | **Anti-laço:** `401` **sem** `cos_renewed` ⇒ `mode=renew`; **com** `cos_renewed` ⇒ `mode=end` | U | `session.test.ts` | — |
| 27.1 | B1, C | `401` ⇒ `mode=end` **sempre** (não existe renovação) | U | `session.test.ts` | — |
| 28 | B2 | **Ciclo terminal:** modelo de estados puro (DAL + `renew` + `end`) com API que sempre devolve `401` em dados e `200` na renovação ⇒ no máximo **1** renovação e término em `/login` | U | `session-flow.test.ts` | laço real navegador↔Next |
| 28.1 | B1, C | Modelo de estados: `401` ⇒ `end` ⇒ `/login`, **sem** laço possível | U | `session-flow.test.ts` | idem |
| 29 | B1 | `POST end`: remove `cos_access` e `cos_refresh`, **0** chamadas à API, `303` `/login?reason=session` | I | `end.int.test.ts` | — |
| 30 | B1 | Logout **L1, L4, L5, L6, L7′, L9** (ADR §7), parametrizado: registra **resultado observado**, **revogação remota** (`unconfirmed`/`not_revoked_by_call`/`unknown`/`not_attempted` — **nunca** "revogada"), cookies removidos, mensagem A/B; `303` `/login` | I | `logout.int.test.ts` | revogação real |
| 30.1 | B2 | Logout **L2, L3, L7, L8** (envolvem renovação), incluindo `token_unusable` | I | `logout.int.test.ts` | idem |
| 31 | B1 | Em **todos** os desfechos de logout de B1 há `Set-Cookie` de remoção de `cos_access` e `cos_refresh` com `Path` correto | I | `logout.int.test.ts` | remoção efetiva no navegador |
| 31.1 | B2 | Idem, incluindo `cos_renewed` | I | `logout.int.test.ts` | idem |
| 32 | A | Mensagens de lista fechada; nenhuma contém "revogad" nem "nada foi revogado"; nenhuma contém token, stack, `path` ou `message` crua da API | U | `messages.test.ts` | — |
| 33 | B1 | Log de servidor do **logout** registra resposta observada, estado de revogação remota e limpeza dos cookies, **sem** tokens | U | `logout.test.ts` | — |
| 33.1 | B1 | Log de servidor do **`end`** registra o **evento `end`**, **nenhuma chamada à API**, revogação remota **`not_attempted`**, **cookies removidos** e **ausência de tokens** (decisão de 22/10/2026; critério independente do AC-33) | U | `end.test.ts` | — |
| 34 | B1 | Proxy: sem `cos_access` ⇒ `/login?next=`; com cookie segue; matcher exclui `_next`, estáticos, `/login`, `/session/*`, `/api/session/*` [HIP-9] | U | `proxy.test.ts` | execução pelo Next |
| 34.1 | B1 | Cookie `cos_access` **presente porém inválido/obsoleto/forjado**: o Proxy **não** bloqueia a navegação; a API simulada responde `401`; o DAL encaminha a `mode=end`; cookies removidos; **a presença do cookie não é tratada como sessão válida** | I | `session.int.test.ts` | Proxy executado pelo Next |
| 35 | A | DAL: `2xx/401/403/404/400/5xx/rede/timeout/corpo inválido` ⇒ classificação da ADR §3; sempre `Bearer`, `cache: 'no-store'`, timeout; `403` e `5xx` **não** removem cookies nem renovam | U, I | `api-client.test.ts`, `api-client.int.test.ts` | — |
| 36 | A, B1, C, B2 *(transversal)* | **Nenhuma chamada de rede (`fetch`) fora de `api-client.ts`, excluindo testes** (redação de 22/10/2026; a verificação por `API_BASE_URL` da revisão 8 foi **substituída**). Comando **proposto**, não executado: `git grep -nE "\bfetch\b" -- apps/web ':!*.test.ts'` deve listar só `api-client.ts` | U (revisão) | relatório do bloco | chamadas de rede por outros meios que não `fetch` (revisão manual) |
| 37 | C | `/v1/users/me`: `5xx`/rede ⇒ página renderiza sem nome + aviso; `401` ⇒ `end` | I | `session.int.test.ts` | renderização real |
| 37.1 | B2 | `401` em `/v1/users/me` ⇒ etapa de renovação | I | `session.int.test.ts` | idem |
| 38 | C | Listar Projects: `401` ⇒ `end`; `403` ⇒ "sem permissão"; `5xx`/rede/corpo inválido ⇒ mensagem + tentar de novo, sem lista parcial | I | `projects.int.test.ts` | idem |
| 38.1 | B2 | `401` ⇒ etapa de renovação | I | `projects.int.test.ts` | idem |
| 39 | C | Criar Project: `201` ⇒ aparece na lista; `400` ⇒ erros por campo, valores preservados; `401` ⇒ `session-expired` com URL da etapa (`end`); `5xx`/rede ⇒ mensagem genérica, formulário preservado | I | `projects.int.test.ts` | idem |
| 40 | B1 | `/login?reason=session` exibe **"Sua sessão terminou. Entre novamente."** (chave aditiva na lista fechada de `messages.ts`; AC-32 se aplica); valores de `reason` fora da lista são ignorados (`parseReason`, Bloco A, `safe-next.test.ts`). **Alteração aditiva em `messages.ts` e `messages.test.ts` autorizada em 22/10/2026 (ADR-014, D-13); nenhuma outra alteração no Bloco A** | U | `messages.test.ts` | — |
| 40.1 | B2 | `reason=renewal` exibe texto distinto e neutro | U | `messages.test.ts` | — |
| 41 | B1 | Smoke: `GET /session/continue?mode=end` **sem** `Set-Cookie` e **sem** chamada à API (log da API); envio automático **uma vez** (dev e produção); sem JavaScript o botão funciona [HIP-13] | M | relatório | — |
| 41.1 | B2 | Idem para `mode=renew` | M | relatório | — |
| 42 | B1 | Smoke: `end` e `logout` são **`POST` → `303`** → destino em `GET` (DevTools); `GET` nesses caminhos não altera cookies nem chama a API [HIP-11] | M | relatório | — |
| 42.1 | B2 | Idem para `renew` | M | relatório | — |
| 43 | B2 | Smoke de concorrência: 2–3 abas com access expirado — **registrar** o resultado (renovações no log da API; algum `401` de reuso; login forçado). **Sem a estratégia aprovada não é critério de aprovação** | M | relatório | — |
| 43.1 | B2, condicional a O2 | 2–3 abas retomadas ao mesmo tempo: **uma renovação por vez**, nenhum `401` de reuso, nenhuma revogação global, em cada navegador-alvo; registrar à parte o caso sem JavaScript/sem `navigator.locks` [HIP-17, HIP-18] | M | relatório | outros navegadores/versões |
| 43.2 | B2, condicional a O2 | O bloqueio é liberado em `pagehide`, no limite de retenção e na espera esgotada (⇒ `unavailable`, cookies intactos) [HIP-18, HIP-20] | M | relatório | — |
| 43.3 | B2, condicional a O2 | `lock-policy`: com `navigator.locks` **simulado**, adquirir → enviar → manter até `pagehide`; espera esgotada ⇒ `unavailable`; sem a API ⇒ segue sem bloqueio | U | `lock-policy.test.ts` | **que a Web Locks API real se comporte como o simulado** |
| 44 | B1 | Smoke de cookies: atributos corretos no DevTools; após logout/`end` **ausentes** (mesmo `Path`); Voltar não mostra conteúdo autenticado [HIP-3, HIP-6] | M | relatório | — |
| 44.1 | B2 | Após a renovação os três cookies são regravados | M | relatório | — |
| 45 | A | `pnpm --filter web test` conforme tabela de comandos (script presente, N ≥ 1, 0 failed) | — | Bloco A | — |
| 46 | A, B1, C, B2 *(transversal)* | **`test`, `lint`, `check-types` e `build`** executados conforme a tabela de comandos, com resultados reais registrados | — | todos os blocos | Windows até execução |
| 47 | A, B1, C, B2 *(transversal)* | Escopo: nenhum arquivo proibido alterado (comando da tabela) **e** toda alteração em arquivo do Bloco A **identificada, justificada e autorizada explicitamente antes da execução** (no B1, a única autorizada é a de AC-40/D-13 em `messages.ts` e `messages.test.ts`). Comando **proposto**, não executado: comparar `git diff --name-only origin/main...HEAD` com `git diff --name-only 13c4d82 fe58c24` (arquivos do Bloco A) | — | todos os blocos | — |

### Smoke manual (M) contra a API real — checklist (Windows, PowerShell; comandos **propostos**, **não executados**)

Pré-requisitos informados/lidos (ADR F24/F25): Docker Compose em `.\docker\docker-compose.yml` (serviço `postgres`, porta `5432`);
`.env` da API a partir de `.env.example` (`JWT_SECRET` precisa de valor; `PORT=3001`); variáveis do web (propostas):
`API_BASE_URL=http://localhost:3001`, `APP_ORIGIN=http://localhost:3000`, `SESSION_COOKIE_MAX_AGE_SECONDS` ≤ `JWT_REFRESH_TTL`
do ambiente do smoke. Sequência (comandos existentes: Compose [sintaxe v2 do `docker compose`, **HIP-22: não verificada** na máquina
do Arquiteto-Chefe] e scripts de `ci.yml`/`package.json`):

```
docker compose -f .\docker\docker-compose.yml up -d
pnpm install --frozen-lockfile
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy
pnpm --filter api start:dev
pnpm --filter web dev
```

(`db:migrate` na raiz é `prisma migrate dev`; o CI usa `migrate deploy`. `pnpm test:e2e` na raiz **não existe**.)

- **B1/C:** login válido e inválido; criar/listar Projects; AC-41, 42, 44, 15.11; expirar o access (`JWT_ACCESS_TTL` curto na API)
  e confirmar `401` ⇒ `end` ⇒ login; parar a API (`docker compose … stop` ou parar `start:dev`) e ver login, listagem e logout em
  indisponibilidade; `next start` sobre `http://localhost` com `NODE_ENV=production` (cookie `Secure`, [HIP-6]).
- **B2 (somente após decisão):** AC-41.1, 42.1, 43, 44.1 e, se O2, 43.1/43.2. Use `JWT_ACCESS_TTL` **≥ 2 min** (o marcador
  `cos_renewed` dura ~30 s [HIP-12]; TTL menor geraria falso "laço").
- Os cenários **ambíguos** não são reproduzíveis na API real e ficam só nos testes I.

## Divisão em blocos e governança — [PROP][PEND] na revisão 8 (O7 aprovada em 21/10/2026)

**Sequência: Bloco A → Bloco B1 → Bloco C → Bloco B2** (proposta na revisão 8; **aprovada em 21/10/2026** com O7). A alternativa sem O7 (A → B = B1 + B2, **[BLQ-IMPL]** por P2/P11 → C) **não foi adotada**.

- **Bloco A:** fundação do frontend, configuração, testes e mecanismos básicos de sessão (cookies, origem, DAL), conforme o escopo que vier a ser aprovado.
- **Bloco B1:** fluxo de sessão **sem renovação automática**; inclui **apenas o subconjunto `end`** do comportamento de continuação de sessão
  (login, `proxy.ts`, `continue` modo `end`, `POST end`, `POST logout` sem renovação, `401` ⇒ `end`).
- **Bloco C:** integração dos mecanismos de autorização e acesso a dados (`/projects`, criação, `/users/me`, estados), condicionada à conclusão e aprovação
  de A e B1.
- **Bloco B2:** renovação (`renew`, `cos_renewed`, classificação de falhas ambíguas) e mitigação da concorrência, condicionada às decisões de segurança
  pendentes.

**Fluxo de entrega [INFO]:** `main` protegida; toda mudança futura por **branch → PR → merge**; patches `.patch` em `C:\Users\marceloferreira\Downloads`,
aplicados pelo Arquiteto-Chefe; validação de patch contra clone limpo no commit-base. Branches: `feature/<nome>` e `docs/<nome>` conforme `CONTRIBUTING.md`
e o histórico. O conteúdo documental da revisão 8 foi integrado à `main` pelo PR #33 (`e4f2aa5`).

### Gates de autorização — estado em 14/10/2026 (HISTÓRICO)

> **Gates vigentes em 21/10/2026.** Baseline/Design Freeze: **PENDENTE / não declarado.** **Bloco A:** concluído, integrado e com resultado técnico aprovado. **Bloco B1:** autorizado de forma condicionada (O7 e P10 `end`
> aprovadas). **Bloco C:** depende de B1 aprovado. **Bloco B2:** **bloqueado**. Os itens abaixo são o texto de 14/10/2026, com atualizações identificadas (`→ Vigente`).

- **Baseline/Design Freeze:** o **merge do PR exclusivamente documental ocorreu** (PR #33, `e4f2aa5`; **[FATO-L]**, revalidado em 14/10/2026). A **aprovação explícita dos documentos como baseline pelo Arquiteto-Chefe não está registrada ⇒ PENDENTE.** **Design Freeze não declarado.**
- **Bloco A:** **P1, P3, P5 e P12 aprovadas** e **P7/P8/P9 confirmadas fora do escopo** (registro nas instruções do Arquiteto-Chefe de 14/10/2026, não versionado no repositório). **PENDENTES em 14/10/2026:** aprovação da baseline e **autorização formal do Arquiteto-Chefe** para iniciar o bloco, após auditoria. **→ Vigente em 21/10/2026: Bloco A concluído, integrado (PR #35) e com resultado técnico aprovado; a aprovação da baseline segue PENDENTE.** A verificação de Node (≥ 22.12) e `pnpm` 11.11.0 no Windows continua a registrar no relatório de A. TTL: referência local `7d` (604.800 s) registrada como **[INFO]**; demais ambientes a confirmar antes da implantação (ver nota de TTL).
- **Bloco B1:** depende da **conclusão e aprovação de A**, da **decisão O7** e da **aprovação de P10 para o subconjunto `end`**. **→ Vigente em 21/10/2026: as três dependências estão registradas; B1 autorizado de forma condicionada (ADR-014, registro final).** **Em 22/10/2026: a autorização continua condicionada à integração do registro de 22/10/2026 e à validação do estado-base no Windows; B1 não liberado.**
- **Bloco C:** depende da **conclusão e aprovação de A e B1**.
- **Bloco B2:** depende da **aprovação de B1**, da **decisão P2**, da **política de renovação de P10** e da **decisão P11**; **se O2 for adotada**, exige também **smoke tests de navegador para HIP-17/HIP-18**; **se E-A for adotada**, exige a **correção prévia da API** e a **reavaliação de P11**.
- **Implantação além de uso individual/desenvolvimento:** depende das **condições comuns** de segurança e operação (ADR §5.7) e da **resolução de O1b** ou de **aceite explícito, informado e documentado** do risco residual. P9 (CI do frontend, fora desta sprint) **bloqueia a prontidão para produção**.

Cada bloco, futuramente, exige **branch e PR próprios, validação documentada e aprovação explícita antes de avançar ao seguinte**. O estado de cada decisão P1–P12 e de O7 está
na ADR-014 ("Estado das decisões"); P2, P4, P6, P10 e P11 e O7 **permaneciam pendentes em 14/10/2026**; **recomendação técnica não é decisão aprovada**. **→ Vigente em 21/10/2026: O7 e P10 (`end`) aprovadas; P2, P4, P6 e P11 seguem pendentes; P10 `renew`/`unavailable` segue pendente.**

## Riscos

Classificados em **segurança × operação**, com [BLQ-IMPL]/[BLQ-DEPL], na ADR-014 ("Estado de decisões, riscos e gates"): RA-1 a RA-16.

## Fora de escopo (explicitamente, nesta sprint)

`apps/api` (O1a/O1b, rotação atômica, tolerância/idempotência, expiração do refresh na resposta); `turbo.json`, `package.json` raiz, `.github/workflows/ci.yml`;
`PROJECT_STATUS.md` até o encerramento; Playwright, Testing Library; cache pós-conclusão de tokens; sessão no servidor com armazenamento compartilhado (O3);
rate limiting; deploy/proxy reverso (`serverActions.allowedOrigins`).

## Estado de aprovação

> **Os dois parágrafos abaixo, até o subtítulo "Evidência de CI — SPR-015 Bloco A", são o estado em 14/10/2026 (HISTÓRICO).** Vigente em 21/10/2026: ver o bloco "Estado vigente" no início deste documento. Onde divergem, vale o vigente.

**Decisões individuais:** P1, P3, P5 e P12 aprovadas; P7, P8 e P9 confirmadas fora do escopo do Bloco A; demais pendentes (ver ADR-014).
**Revisão 8 como baseline: aprovação não registrada.** **Design Freeze não declarado** (o bloco `DESIGN FREEZE — SPR-015` só existirá, no padrão das SPR anteriores, **depois**
da aprovação explícita da baseline pelo Arquiteto-Chefe; o merge do PR documental já ocorreu e **não** substitui essa aprovação). **Autorização do Bloco A: não concedida em 14/10/2026** (Bloco A posteriormente integrado — PR #35 — e com resultado técnico aprovado em 21/10/2026).

### Evidência de CI — SPR-015 Bloco A

- **PR:** #35 — SPR-015 Bloco A: fundação frontend
- **Workflow:** `ci.yml`
- **Execução:** #48
- **Job:** `Lint, Test, Build, E2E`
- **Resultado:** Success
- **Duração total exibida:** 1 min 25 s
- **Evidência:** tela do GitHub Actions fornecida em 21/10/2026.
- **Avisos:** depreciação do Node.js 20 nas Actions e migração futura do `ubuntu-latest` para Ubuntu 26.
- **Conclusão:** o CI associado ao PR #35 foi concluído com sucesso.

**Limitação:** essa evidência comprova a execução bem-sucedida do CI do PR. Isoladamente, não comprova que os testes foram executados novamente após o merge no `main` nem identifica a revisão exata testada.

**Nota de 21/10/2026 sobre o alcance dessa evidência:** o `ci.yml` executa somente passos de `apps/api` (`pnpm --filter api ...`) **[FATO-L]**; por isso o CI da PR #35 **não comprova** lint, testes, `check-types` ou build do `apps/web`. A evidência técnica do `apps/web` no Bloco A é a **execução local relatada em 21/10/2026** (183 testes aprovados; lint sem erros exibidos; `check-types` com saída 0; build
bem-sucedido), que o Engenheiro **não** verificou de forma independente neste registro. Aprovação do resultado técnico do Bloco A pelo Arquiteto-Chefe: ver o bloco "Estado vigente" no início deste documento.
