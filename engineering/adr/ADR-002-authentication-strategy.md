# ADR-002 — Estratégia de Autenticação e Refresh Token

## Status

Proposta — aguardando aceite do Arquiteto do Content-OS. Não implementar antes do aceite formal.

## Context

O Content-OS precisa de autenticação para viabilizar qualquer módulo de negócio real (usuários,
projetos, conteúdo). Essa é uma decisão que, uma vez adotada, é cara de reverter — trocar de
estratégia de autenticação depois que módulos de negócio já dependem dela envolve migração de
dados de sessão, possível invalidação de todos os usuários logados, e reescrita de guards/DTOs
em toda a API. Por isso, conforme critério do `ENGINEERING_GUIDE.md` ("Estabelece um padrão que
vale para todo o projeto daí em diante" + "É difícil ou cara de reverter"), esta decisão é
formalizada como ADR, não apenas como Design Doc.

## Decision

- Autenticação via **JWT** (`@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`), seguindo a
  abordagem oficial documentada pelo NestJS.
- **Access token**: JWT stateless, HS256, TTL de 15 minutos.
- **Refresh token**: token opaco (não-JWT), armazenado hasheado (SHA-256) em tabela própria
  (`RefreshToken`), com **rotação a cada uso** e **detecção de reuso** (revogação em cascata de
  toda a família de tokens de um usuário caso um token já revogado seja reapresentado).
- **Hash de senha**: bcrypt, fator de custo 10.
- **Autorização por padrão**: guard global (`APP_GUARD`) aplicando `JwtAuthGuard` a toda rota,
  com decorator `@Public()` para as exceções explícitas.
- **RBAC (papéis/permissões) não faz parte desta ADR** — é tratado como decisão arquitetural
  separada, quando a Release 0.5 (RBAC) do roadmap for iniciada.

O detalhamento completo (fluxos, modelagem, alternativas descartadas) está em
`engineering/designs/SPR-006-security-foundation.md`; esta ADR registra apenas a decisão em si,
para consulta rápida futura, conforme padrão já usado pela ADR-001.

## Consequences

- Toda rota nova é protegida por padrão, salvo marcação explícita com `@Public()`.
- Toda sessão de usuário é revogável e rastreável por dispositivo, via a tabela `RefreshToken` —
  ao custo de uma consulta ao banco a cada chamada de `/auth/refresh` (não a cada request comum,
  já que o access token continua sendo validado apenas por assinatura).
- Mudar de estratégia de hash de senha, formato de token, ou modelo de revogação no futuro exige
  uma nova ADR que substitua esta, e potencialmente uma estratégia de migração para sessões já
  emitidas.
- Implementar RBAC no futuro (Release 0.5) não deve exigir revisar esta ADR — o guard global e o
  payload do JWT já preveem espaço para claims adicionais (ex.: `roles`) sem quebrar o que está
  decidido aqui.
