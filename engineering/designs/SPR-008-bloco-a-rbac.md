# SPR-008 — Bloco A — RBAC (Design Doc)

Status: Accepted

## Objetivo

Implementar a autorização por papel sobre a autenticação já entregue na SPR-007, conforme
`ADR-004-rbac-strategy.md`.

---

## Modelagem

```
enum Role {
  SUPER_ADMIN
  ADMIN
  USER
}

model User {
  ...
  role Role @default(USER)
}
```

Sem tabelas `Role`, `Permission` ou `UserRole` — decisão registrada e justificada na `ADR-004`.

---

## Fluxo

```
Request
  │
  ▼
JwtAuthGuard (global, APP_GUARD)      → autentica, popula request.user com { sub, email, role }
  │
  ▼
RolesGuard (local, @UseGuards)        → lê metadata de @Roles() via Reflector
  │                                      - sem @Roles() → autorizado (mesmo comportamento de hoje)
  │                                      - com @Roles(...) → compara request.user.role
  ▼
Controller
```

`RolesGuard` só é aplicado em rotas que explicitamente usam `@Roles(...)` — não é global, para
não exigir que toda rota declare papéis (rotas autenticadas sem `@Roles()` continuam acessíveis
a qualquer usuário autenticado, como já é hoje).

---

## Contrato do JWT

```ts
interface JwtPayload {
  sub: string;
  email: string;
  role: Role; // novo
}
```

---

## Cobertura de testes prevista

- `RolesGuard`: sem `@Roles()` → permite; com `@Roles(ADMIN)` e usuário `ADMIN` → permite; com
  `@Roles(ADMIN)` e usuário `USER` → nega (403); múltiplos papéis aceitos em `@Roles()`.
- `AuthService`/`JwtStrategy`: `role` presente e propagado corretamente do usuário para o token
  e de volta para `request.user`.
- E2E: como não há, nesta sprint, nenhuma rota de negócio nova que use `@Roles()` (fora de
  escopo — ver backlog), a validação E2E do guard é feita através de uma verificação de unidade
  de integração do próprio guard dentro do bootstrap da aplicação (Nest testing module), não por
  uma rota HTTP real protegida por papel. Este ponto está registrado no relatório final do
  Bloco A como uma limitação a resolver quando a primeira rota real com `@Roles()` existir.

---

## Critérios de Aceite

- Usuário sem papel definido é criado como `USER` por padrão.
- Token emitido contém `role`.
- `RolesGuard` bloqueia com 403 quando o papel do usuário não está na lista de `@Roles()`.
- Nenhuma rota existente da SPR-007 tem seu comportamento alterado (nenhuma delas usa `@Roles()`
  hoje).
