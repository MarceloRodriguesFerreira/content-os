# SPR-006 — Design da Camada de Segurança

> **Status:** Proposto — aguardando aprovação do Arquiteto antes da implementação (SPR-007).
> **Esta sprint é exclusivamente de arquitetura.** Nenhum código, migration, dependência ou
> alteração em `apps/`, `packages/` ou `docker/` foi produzida — apenas este documento e a
> ADR-002 (proposta) em `engineering/adr/`.

---

## 1. Objetivos

Projetar a arquitetura completa de autenticação e autorização do Content-OS — a base sobre a
qual todo módulo de negócio futuro (usuários reais, projetos, conteúdo) vai se apoiar — antes de
escrever qualquer linha de código.

Ao final desta sprint, a próxima sprint (SPR-007) deve poder implementar sem precisar tomar
nenhuma decisão arquitetural nova: só executar o que foi decidido aqui.

## 2. Motivação

Até a SPR-005, o Content-OS não tem nenhum conceito de usuário, sessão ou permissão — toda rota
é pública. Isso bloqueia qualquer módulo de negócio real (que precisa saber "de quem" é o
projeto/conteúdo sendo criado). `ARCHITECTURE.md` já lista **JWT** como a Release 0.4 do roadmap
técnico, separada de **RBAC** (Release 0.5) — ou seja, o próprio roadmap oficial já preconiza
que autenticação e autorização por papéis/permissões são entregas distintas, não uma única
sprint. Este design respeita essa separação.

## 3. Escopo

- Autenticação via JWT (access token + refresh token).
- Cadastro/login de usuário com senha (hash).
- Refresh token com rotação e revogação.
- Logout.
- Guard global de autenticação (rotas protegidas por padrão).
- Modelagem da entidade `User` (conceitual, sem migration).
- Estrutura de pastas e responsabilidades dos módulos `auth` e `users`.
- Documentação Swagger da autenticação (Bearer).
- Estratégia de testes (unitário/integração/e2e).

## 4. Fora do Escopo

- **RBAC (papéis/permissões)** — módulos `roles/`/`permissions/` **não** fazem parte desta
  sprint. É a Release 0.5 no roadmap de `ARCHITECTURE.md`, sprint própria, com seu próprio
  design. Implementar agora seria antecipar estrutura sem consumidor real (violaria o princípio
  de YAGNI já seguido em todas as sprints anteriores do projeto — ver, por exemplo, a revisão de
  `configuration.ts` na SPR-003, que removeu campos especulativos de configuração).
- **Recuperação de senha (implementação)** — só a estratégia é documentada (seção 8.7); a
  implementação depende de um serviço de envio de e-mail que o projeto ainda não tem.
- **OAuth/login social** (Google, etc.) — não mencionado no roadmap atual; fora de escopo.
- **Blacklist de access token via Redis** — ver seção 7 (Riscos) para justificativa de por que
  não é necessário agora.
- **Verificação de e-mail no cadastro** — não especificado no escopo desta sprint; pode ser
  avaliado junto da recuperação de senha, futuramente.
- Qualquer migration, instalação de dependência ou alteração em `apps/`, `packages/`, `docker/`.

---

## 5. Arquitetura Proposta

### 5.1 Diagrama textual

```
                         ┌─────────────────────┐
                         │   Cliente (Next.js)  │
                         └──────────┬───────────┘
                                    │ Authorization: Bearer <access_token>
                                    ▼
                         ┌─────────────────────┐
                         │   JwtAuthGuard        │  ← Global (APP_GUARD)
                         │   (+ @Public())       │
                         └──────────┬───────────┘
                                    │ token válido → req.user
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │                     AuthModule                      │
        │  ┌───────────────┐   ┌────────────────────────┐   │
        │  │ AuthController │──▶│      AuthService        │   │
        │  └───────────────┘   │  - login()               │   │
        │                       │  - refresh()             │   │
        │                       │  - logout()               │   │
        │                       └──────┬──────────┬────────┘   │
        │                              │          │            │
        │                    ┌─────────▼──┐  ┌────▼──────────┐ │
        │                    │ JwtStrategy │  │ RefreshTokens  │ │
        │                    │ (Passport)  │  │ Repository     │ │
        │                    └─────────────┘  └────────┬──────┘ │
        └────────────────────────────────────────────┬─┼────────┘
                                                       │ │
                              ┌────────────────────────┘ │
                              ▼                           ▼
                     ┌─────────────────┐         ┌─────────────────┐
                     │   UsersModule    │         │  PrismaService   │
                     │  UsersRepository │────────▶│  (@Global(),     │
                     └─────────────────┘         │   já existente)  │
                                                   └────────┬────────┘
                                                            ▼
                                                     PostgreSQL
                                                     (User, RefreshToken)
```

### 5.2 Módulos e onde vivem

Dois módulos novos, seguindo exatamente o padrão de organização já usado por `PrismaModule`/
`AppConfigModule`/`HealthModule` (`apps/api/src/modules/`):

```
apps/api/src/modules/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   └── auth-response.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── decorators/
│   │   ├── public.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── repositories/
│   │   └── refresh-tokens.repository.ts
│   └── interfaces/
│       └── jwt-payload.interface.ts
└── users/
    ├── users.module.ts
    ├── users.controller.ts
    ├── users.service.ts
    ├── dto/
    │   ├── create-user.dto.ts
    │   └── user-response.dto.ts
    └── repositories/
        └── users.repository.ts
```

**Diferença proposta em relação ao exemplo do enunciado:** não há pastas `roles/`/`permissions/`
(fora de escopo, seção 4) e não há pasta `entities/` em `users/` — o projeto usa Prisma (não
TypeORM), então não existem classes de entidade decoradas; o "modelo" já é o `schema.prisma` +
os DTOs de saída (`UserResponseDto`). Criar uma pasta `entities/` vazia ou com classes que só
espelham o Prisma sem função própria seria duplicação sem propósito.

### 5.3 Por que Repository Pattern para `Users` e `RefreshToken`

`ARCHITECTURE.md` já lista "Repository Pattern" como padrão adotado. `PrismaService` é
`@Global()` e poderia ser injetado direto em `AuthService`/`UsersService`, mas isso acopla a
regra de negócio ao Prisma diretamente. Um `UsersRepository`/`RefreshTokensRepository` fino
(métodos como `findByEmail`, `create`, `findValidByHash`, `revoke`) mantém `AuthService`
testável com mocks simples, sem precisar mockar o Prisma inteiro, e sem forçar
`AuthController`/`AuthService` a conhecer a forma exata do schema.

---

## 6. Modelagem da entidade `User`

Conceitual — **sem alterar `schema.prisma`, sem migration**.

| Campo | Tipo | Constraint/Índice | Motivo |
|---|---|---|---|
| `id` | `String` (UUID) | PK, `@default(uuid())` | Identificador estável, não sequencial (não vaza contagem de usuários) |
| `email` | `String` | `@unique` | Login é por e-mail; unicidade é regra de negócio, não só de UI |
| `passwordHash` | `String` | not null | Nunca a senha em texto puro — hash bcrypt |
| `name` | `String` | not null | Nome de exibição, usado no restante do produto |
| `isActive` | `Boolean` | `@default(true)` | Desativação de conta sem apagar histórico (soft-disable, não soft-delete — ver seção 7) |
| `createdAt` | `DateTime` | `@default(now())` | Auditoria mínima |
| `updatedAt` | `DateTime` | `@updatedAt` | Auditoria mínima |
| `refreshTokens` | relação 1:N | — | Um usuário pode ter múltiplos refresh tokens ativos (múltiplos dispositivos/sessões) |

### 6.1 Entidade `RefreshToken` (nova, auxiliar)

| Campo | Tipo | Constraint/Índice | Motivo |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `userId` | `String` | FK → `User.id`, índice | Consulta rápida "todos os tokens de um usuário" (necessário para revogação em massa) |
| `tokenHash` | `String` | `@unique`, índice | Nunca armazenar o token em texto puro (mesmo raciocínio de senha); índice único permite lookup O(1) no refresh |
| `expiresAt` | `DateTime` | — | TTL do refresh token |
| `revokedAt` | `DateTime?` | nullable | Marca revogação (logout, rotação, ou detecção de reuso) sem apagar a linha (auditoria) |
| `replacedByTokenId` | `String?` | nullable, FK → `RefreshToken.id` | Encadeia a "família" de rotação — necessário para detecção de reuso (seção 8.4) |
| `createdAt` | `DateTime` | `@default(now())` | Auditoria |

**Por que uma tabela própria, e não um campo em `User`:** um único campo
`refreshTokenHash` em `User` só suportaria uma sessão ativa por usuário — logar em um
segundo dispositivo invalidaria o primeiro silenciosamente. Uma tabela dedicada permite múltiplas
sessões concorrentes, revogação individual (por dispositivo) ou total (todas de uma vez, em caso
de comprometimento), e a cadeia de rotação necessária para detecção de reuso.

---

## 7. Estratégia de Autenticação — Decisões e Justificativas

### 7.1 Access Token

- **JWT**, assinado com **HS256** (segredo simétrico via `AppConfigService`, nunca hardcoded).
- **TTL curto: 15 minutos.**
- Stateless — validado só pela assinatura, sem consulta ao banco a cada request (baixa
  latência, sem carga extra no Postgres por request autenticado).

**Alternativa considerada:** RS256 (par de chaves assimétrico). Só traz benefício real quando
outro serviço, sem acesso ao segredo de emissão, precisa validar tokens de forma independente
(cenário de microsserviços). O Content-OS é hoje um monólito (`apps/api`); não há esse
consumidor. Registrado como melhoria futura caso a arquitetura evolua para múltiplos serviços.

### 7.2 Refresh Token

- **Token opaco** (string aleatória de alta entropia, ex. `crypto.randomBytes(64)` em base64url)
  — **não é um JWT.**
- Armazenado **hasheado** (SHA-256, não bcrypt) na tabela `RefreshToken`.
- **TTL longo: 7 dias.**

**Por que opaco em vez de JWT:** um refresh token JWT stateless não pode ser revogado
individualmente sem uma blacklist (reintroduzindo estado de qualquer forma). Um token opaco
validado por lookup no banco já é, por definição, revogável e rotacionável — sem necessidade de
infraestrutura adicional (Redis, blacklist).

**Por que SHA-256 e não bcrypt para o hash do refresh token:** bcrypt é desenhado para senhas de
**baixa entropia** escolhidas por humanos (por isso é lento de propósito, para dificultar força
bruta). Um refresh token já é gerado com entropia alta (aleatório, 512 bits); um hash rápido
(SHA-256) é suficiente e evita custo de CPU desnecessário a cada refresh — aplicar o mesmo custo
de bcrypt aqui seria pessimizar sem ganho de segurança real.

### 7.3 Rotação de Refresh Token

A cada chamada de `/auth/refresh`:

1. O token recebido é hasheado e buscado na tabela.
2. Se não existir, estiver expirado ou já **revogado** → rejeita (401).
3. Se válido: marca o token atual como revogado (`revokedAt = now()`), cria um novo
   `RefreshToken` e preenche `replacedByTokenId` no antigo apontando para o novo (encadeamento).
4. Retorna novo access token + novo refresh token.

### 7.4 Detecção de Reuso (proteção contra roubo de token)

Se um refresh token **já revogado** (isto é, já rotacionado/usado antes) for apresentado
novamente, isso é sinal de que o token vazou e alguém mais o está usando. Nesse caso: revoga
**todos** os refresh tokens ativos daquele `userId` (toda a "família"), forçando novo login em
todos os dispositivos. Este é o comportamento recomendado pela prática de mercado (rotação com
detecção de reuso) e é viabilizado diretamente pelo encadeamento `replacedByTokenId` da seção 6.1.

### 7.5 Logout

Revoga (`revokedAt = now()`) apenas o refresh token específico apresentado. O access token em
circulação **não** é invalidado — por ter TTL curto (15 min), o risco residual é aceito
explicitamente (ver seção 9, Riscos) em troca de não introduzir uma blacklist com estado
compartilhado (Redis) nesta fase do projeto.

### 7.6 Hash de senha

**bcrypt**, fator de custo 10 (valor fixo por ora — não exposto como variável de configuração:
segue o mesmo princípio já aplicado em `configuration.ts` na SPR-003, de não introduzir
configuração sem um consumidor real que precise variá-la hoje).

### 7.7 Recuperação de senha — apenas estratégia (não implementar)

Fluxo pretendido para quando houver capacidade de envio de e-mail:
1. Usuário solicita reset via e-mail.
2. Gera-se um token opaco de uso único, TTL curto (ex. 1 hora), armazenado hasheado (mesmo
   padrão do refresh token) em uma tabela própria (`PasswordResetToken`) — não reaproveitar a
   tabela `RefreshToken` para isso, são conceitos diferentes (um autentica sessão contínua, o
   outro autoriza uma única ação).
3. E-mail contém link com o token em texto puro; back-end só guarda o hash.
4. Ao confirmar nova senha, o token é validado, marcado como usado, e **todos** os refresh
   tokens existentes do usuário são revogados (troca de senha deve encerrar todas as sessões
   ativas).

---

## 8. Fluxos Completos

### 8.1 Autenticação (login)

```
Cliente          AuthController      AuthService      UsersRepository   RefreshTokensRepository
  │  POST /auth/login                                                            
  │  {email, senha}                                                              
  ├──────────────▶│                                                             
  │                ├──────────────▶│                                            
  │                │                ├──── findByEmail(email) ──▶│               
  │                │                │◀──────── User ─────────────┤               
  │                │                │  bcrypt.compare(senha, user.passwordHash)  
  │                │                │  [se inválido] ──▶ 401 Unauthorized       
  │                │                │  gera accessToken (JWT, 15min)             
  │                │                │  gera refreshToken opaco (7d)              
  │                │                ├──── create(refreshTokenHash) ────────────▶│
  │                │◀── {accessToken, refreshToken} ──┤                          
  │◀── 200 {accessToken, refreshToken} ──┤                                       
```

### 8.2 Refresh Token

```
Cliente          AuthController      AuthService              RefreshTokensRepository
  │  POST /auth/refresh
  │  {refreshToken}
  ├──────────────▶│
  │                ├──────────────▶│
  │                │                ├── findValidByHash(hash) ──▶│
  │                │                │◀── RefreshToken | null ────┤
  │                │                │  [null ou expirado] ──▶ 401
  │                │                │  [revokedAt != null] ──▶ revoga TODOS os
  │                │                │                          tokens do usuário
  │                │                │                          (reuso detectado) ──▶ 401
  │                │                │  [válido] revoga atual, cria novo (rotação)
  │                │                │  gera novo accessToken
  │                │◀── {accessToken, refreshToken} ──┤
  │◀── 200 {accessToken, refreshToken} ──┤
```

### 8.3 Logout

```
Cliente          AuthController      AuthService      RefreshTokensRepository
  │  POST /auth/logout
  │  {refreshToken}
  ├──────────────▶│
  │                ├──────────────▶│
  │                │                ├── revoke(hash) ──▶│
  │                │◀── void ───────┤
  │◀── 204 No Content ──┤
```

### 8.4 Autorização (rota protegida)

```
Cliente                    JwtAuthGuard (global)         JwtStrategy         Controller
  │  GET /users/me
  │  Authorization: Bearer <accessToken>
  ├──────────────────────▶│
  │                        │  @Public()? não ──▶ segue validação
  │                        ├──────────────────▶│
  │                        │                     │  verifica assinatura + expiração
  │                        │                     │  [inválido/expirado] ──▶ 401
  │                        │                     │  [válido] retorna payload → req.user
  │                        │◀────────────────────┤
  │                        ├──────────────────────────────────────────────▶│
  │                        │                                                │  usa @CurrentUser()
  │◀── 200 {...} ──────────────────────────────────────────────────────────┤
```

**Rotas públicas** (`@Public()`): `/auth/login`, `/auth/refresh`, `/health`, `/api/docs`.
Todo o resto é protegido por padrão (secure-by-default) — decisão deliberada: é mais seguro
exigir que alguém marque explicitamente uma rota como pública do que confiar que ninguém vai
esquecer de proteger uma rota nova.

---

## 9. Riscos

| Risco | Mitigação / Decisão |
|---|---|
| Access token não pode ser revogado antes de expirar (ex.: usuário faz logout, mas o access token ainda circula por até 15 min) | Aceito conscientemente — TTL curto limita a janela; blacklist via Redis é melhoria futura caso o requisito de revogação instantânea se torne real (ver "Fora do escopo") |
| Segredo JWT (`JWT_SECRET`) comprometido invalida toda a base instalada | Deve ser gerado com alta entropia e nunca commitado — mesma disciplina já aplicada a `DATABASE_URL` desde a SPR-003 |
| Fator de custo do bcrypt fixo em 10 pode ficar defasado com o tempo (hardware fica mais rápido) | Revisão futura, não bloqueante hoje; documentado como melhoria |
| Guard global pode "trancar" acidentalmente uma rota nova esquecida sem `@Public()` durante o desenvolvimento | Comportamento esperado e desejado (secure-by-default), não um bug — mas deve ser comunicado ao time como friction esperado |
| Esta é a primeira migration Prisma desde a SPR-002 — risco operacional de regressão na infraestrutura de persistência já estabilizada na SPR-004 | Seguir exatamente o processo já validado (`pnpm db:migrate`), sem alterar `PrismaService`/`PrismaModule` |
| Novas variáveis de ambiente (`JWT_SECRET`, TTLs) precisarão passar por `configuration.ts` + `env.validation.ts` | Não é uma alteração desta sprint (é código), mas é uma dependência direta e obrigatória da SPR-007 — registrado aqui para que a implementação não esqueça a regra "nenhum `process.env` fora do módulo de configuração" |

---

## 10. Decisões Técnicas (resumo)

1. **Passport (`@nestjs/passport` + `passport-jwt`) + `@nestjs/jwt`** — abordagem oficial e
   documentada pelo NestJS para autenticação JWT, em vez de middleware/guard manual reinventando
   verificação de assinatura.
2. **Access token JWT stateless, HS256, TTL 15 min.**
3. **Refresh token opaco, hasheado (SHA-256), TTL 7 dias, com rotação e detecção de reuso.**
4. **bcrypt para senha**, fator de custo 10, fixo (não configurável agora).
5. **Guard global (`APP_GUARD`) + decorator `@Public()`** — secure-by-default.
6. **Repository Pattern** para `Users` e `RefreshToken`, consistente com `ARCHITECTURE.md`.
7. **RBAC (roles/permissions) explicitamente fora de escopo** — Release 0.5 própria.
8. **Recuperação de senha: só estratégia documentada**, sem implementação (depende de
   capacidade de e-mail inexistente hoje).
9. **Sem `entities/` estilo TypeORM** — o projeto usa Prisma; DTOs de saída cumprem esse papel.

---

## 11. Estratégia de Testes

- **Unitários:** `AuthService` (login com credenciais válidas/inválidas, refresh válido/expirado/
  revogado/reuso detectado, logout), `UsersService`/`UsersRepository`, `JwtStrategy` — todos com
  `PrismaService`/repositórios mockados via `jest.spyOn`, seguindo o mesmo padrão já usado em
  `prisma.service.spec.ts` (SPR-004) e `app-config.service.spec.ts` (SPR-003) — sem depender de
  Postgres real.
- **Integração:** fluxo `AuthModule` + `UsersModule` + `PrismaService` real (banco de teste),
  cobrindo o ciclo completo login → refresh → logout diretamente contra o banco.
- **E2E:** requisição HTTP completa (`supertest`, já usado no projeto) cobrindo: login com
  sucesso, tentativa de acesso a rota protegida sem token (401), acesso com token válido (200),
  refresh com rotação, reuso de token revogado (família inteira revogada), logout.

---

## 12. Swagger

- `DocumentBuilder.addBearerAuth()` em `src/swagger.config.ts` (único ponto a alterar nesse
  arquivo, já isolado desde a SPR-005).
- `@ApiBearerAuth()` em todo controller/rota protegida.
- Tag nova: `Auth`.
- Respostas padrão documentadas por rota: `200`/`201` (sucesso), `401` (credenciais inválidas /
  token inválido ou expirado), `409` (e-mail já cadastrado, no registro).
- Exemplos de payload via `@ApiProperty({ example: ... })` nos DTOs, seguindo exatamente o
  padrão já estabelecido em `HealthResponseDto` (SPR-005).

---

## 13. Sequência de Implementação Recomendada (SPR-007)

1. Instalar dependências: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`,
   `bcrypt` (+ `@types/passport-jwt`, `@types/bcrypt` como dev).
2. Estender `configuration.ts`/`env.validation.ts` com `JWT_SECRET`, `JWT_ACCESS_TTL`,
   `JWT_REFRESH_TTL` (via `AppConfigService`, nunca `process.env` direto).
3. Estender `schema.prisma` com os modelos `User` e `RefreshToken` (seção 6) + migration.
4. Implementar `UsersModule` (repository, service, DTOs, controller com `GET /users/me`).
5. Implementar `AuthModule` (strategy, guards, decorators, repository, service, controller:
   `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`).
6. Registrar `JwtAuthGuard` como `APP_GUARD` global em `AppModule`; marcar rotas públicas
   existentes (`/health`, `/api/docs`) com `@Public()`.
7. Atualizar `swagger.config.ts` (Bearer auth) + decorar rotas.
8. Escrever testes (unitário → integração → e2e, nessa ordem).
9. Validar: `pnpm lint`, `pnpm --filter api test`, `pnpm --filter api build`,
   `pnpm --filter api start:dev` + teste manual do fluxo completo via Swagger UI.
10. Atualizar `PROJECT_STATUS.md`/`CHANGELOG.md` (só ao final, com o que de fato foi entregue —
    conforme política do `ENGINEERING_GUIDE.md`).

---

## 14. Critérios de Aceite desta Sprint (design)

- [x] Design Document completo (este arquivo).
- [x] Diagrama textual da arquitetura proposta (seção 5.1).
- [x] Estrutura de diretórios (seção 5.2).
- [x] Fluxo completo da autenticação (seção 8.1–8.4).
- [x] Sequência recomendada para implementação (seção 13).
- [x] Lista de riscos (seção 9).
- [x] Lista de decisões arquiteturais (seção 10).
- [x] Arquivos a criar na próxima sprint (seção 5.2 + 13).
- [x] Relatório final de alternativas consideradas (seção 15).

## 15. Alternativas Consideradas (por que esta arquitetura, e não outra)

| Decisão tomada | Alternativa considerada | Por que foi descartada |
|---|---|---|
| Refresh token opaco | Refresh token também em JWT | JWT stateless não é revogável sem blacklist — reintroduziria estado de qualquer forma, sem o benefício de simplicidade que motivaria usar JWT |
| SHA-256 para hash do refresh token | bcrypt para o refresh token também | bcrypt é caro de propósito para proteger segredos de baixa entropia (senhas); refresh token já é aleatório de alta entropia — custo extra sem ganho de segurança |
| Guard global + `@Public()` | `@UseGuards()` manual em cada controller protegido | Propenso a erro humano (esquecer de proteger uma rota nova); secure-by-default é mais seguro por construção |
| Tabela `RefreshToken` própria | Campo único `refreshTokenHash` em `User` | Não suporta múltiplas sessões/dispositivos nem revogação granular |
| RBAC fora de escopo | Incluir `roles`/`permissions` já nesta sprint (como sugerido no enunciado) | Contraria o próprio roadmap do `ARCHITECTURE.md` (RBAC é Release 0.5, separada de JWT/Release 0.4) e o princípio de YAGNI já aplicado em todas as sprints anteriores — não há regra de negócio hoje que precise de papéis |
| HS256 | RS256 (par de chaves assimétrico) | Só compensa em cenário multi-serviço; o projeto é um monólito hoje |
| bcrypt fator 10 fixo | Fator configurável via env | Nenhum consumidor real precisa variar isso hoje — mesmo princípio de não antecipar configuração sem uso real já seguido em `configuration.ts` (SPR-003) |
