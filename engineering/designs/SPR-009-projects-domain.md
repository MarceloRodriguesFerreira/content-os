# SPR-009 — Domínio: Projetos (Design Doc)

Status: Accepted

## Objetivo

Inaugurar a camada de domínio do Content-OS com o primeiro agregado de negócio: `Project`.
SPR-001 a SPR-008 construíram fundação, persistência, autenticação, RBAC e HTTP Pipeline — nenhum
conceito de negócio existia até aqui. Esta sprint não implementa Campanha, Conteúdo ou
Publicação — apenas `Project`, a raiz de toda a organização de conteúdo (`VISION.md`).

Decisões de arquitetura desta sprint: `ADR-008` (agregado), `ADR-009` (autorização por
propriedade), `ADR-010` (convenções REST).

**Domínio confirmado pelo Product Owner:** a SPR-009 implementará o primeiro domínio de negócio
do Content-OS, e esse domínio é `Project`. Esta não é mais uma inferência arquitetural a partir
do `VISION.md` — é uma decisão de produto confirmada explicitamente antes deste Design Freeze.
`VISION.md` (Release 0.6, seção "Pilares do Produto") permanece como a referência de por que
`Project` é a raiz de todo o modelo de domínio subsequente (Campanha, Conteúdo, Publicação, em
sprints futuras), não como justificativa de uma suposição.

---

## Modelagem

```prisma
enum ProjectStatus {
  ACTIVE
  ARCHIVED
}

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id])
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("projects")
}
```

`User` ganha a relação inversa: `projects Project[]`.

Sem tabela de colaboradores/membros nesta sprint (`ADR-008`). Sem relação com Campanha/Conteúdo
(não existem ainda).

---

## Estrutura de módulo

Segue exatamente o padrão já estabelecido por `AuthModule`/`UsersModule` (Repository Pattern,
Controller fino, regra de negócio no Service):

```
apps/api/src/common/dto/
└── paginated-response.dto.ts      # genérico, compartilhado (ADR-010) — não é específico de Project

apps/api/src/modules/projects/
├── projects.module.ts
├── projects.controller.ts
├── projects.controller.spec.ts
├── projects.service.ts
├── projects.service.spec.ts
├── repositories/
│   ├── projects.repository.ts
│   └── projects.repository.spec.ts
├── guards/
│   ├── project-ownership.guard.ts
│   └── project-ownership.guard.spec.ts
├── dto/
│   ├── create-project.dto.ts
│   ├── update-project.dto.ts
│   ├── list-projects-query.dto.ts
│   └── project-response.dto.ts
```

`ProjectsModule` é importado em `AppModule`, ao lado de `AuthModule`/`UsersModule`.

---

## Fluxo de Autenticação

Nenhum mecanismo novo — reaproveita integralmente o que a `ADR-002`/SPR-007 já estabeleceu:
`JwtAuthGuard` (global) autentica e popula `request.user` com `{ sub, email, role }`; o
`@CurrentUser()` decorator (já existente, usado em `AuthController`/`UsersController`) extrai
isso no `ProjectsController`. `ownerId` em `POST /v1/projects` vem de `currentUser.sub`, nunca do
corpo da requisição — impede que um usuário crie um projeto em nome de outro.

---

## Contrato REST (todas as rotas sob `/v1`, `ADR-005`; envelope de resposta padrão, `ADR-007`)

| Método | Rota | Guards (além do `JwtAuthGuard` global) | Descrição |
|---|---|---|---|
| `POST` | `/v1/projects` | — | Cria projeto; `ownerId` = usuário autenticado |
| `GET` | `/v1/projects` | — | Lista **apenas** projetos do usuário autenticado, paginada/filtrada |
| `GET` | `/v1/projects/:id` | `ProjectOwnershipGuard` | Detalhe de um projeto |
| `PATCH` | `/v1/projects/:id` | `ProjectOwnershipGuard` | Atualiza `name`/`description` |
| `POST` | `/v1/projects/:id/archive` | `ProjectOwnershipGuard` | `ACTIVE` → `ARCHIVED` |
| `POST` | `/v1/projects/:id/restore` | `ProjectOwnershipGuard` | `ARCHIVED` → `ACTIVE` |

Não há `DELETE` (`ADR-008`). `archive`/`restore` são `POST` (ações de mudança de estado, não
substituição de recurso — semântica mais clara que sobrecarregar `PATCH` com um campo `status`
de escrita livre).

### Regras de negócio adicionais

- `archive` em um projeto já `ARCHIVED` → `409 Conflict` (não é idempotente por design — evita
  mascarar um clique duplo do cliente como sucesso silencioso; o design doc de Campanha, quando
  existir, pode revisitar essa escolha com mais contexto de UX).
- `restore` em um projeto já `ACTIVE` → `409 Conflict`, mesma lógica.
- `PATCH` em projeto `ARCHIVED` → permitido (editar nome/descrição de algo arquivado é uma
  operação de manutenção legítima, não uma mudança de ciclo de vida).

---

## DTOs

**`CreateProjectDto`** — `name` (`@IsString @IsNotEmpty @MaxLength(120)`), `description`
(`@IsOptional @IsString @MaxLength(2000)`).

**`UpdateProjectDto`** — mesmos campos de `CreateProjectDto`, ambos `@IsOptional`
(pelo menos um deve ser enviado — validado no Service, não no DTO, seguindo o padrão de regra de
negócio vs. validação de forma já implícito no projeto).

**`ListProjectsQueryDto`** — `page` (`@IsOptional @Type(() => Number) @IsInt @Min(1)`), `limit`
(idem, `@Min(1) @Max(100)`), `status` (`@IsOptional @IsIn([...Object.values(ProjectStatus), 'ALL'])`
— **não** `@IsEnum(ProjectStatus)` sozinho, pois `ALL` não é um valor do enum e seria rejeitado
pela validação; se omitido, filtra `ACTIVE` por padrão; `?status=ARCHIVED` ou `?status=ALL` para
os demais casos).

**`ProjectResponseDto`** — `id`, `name`, `description`, `status`, `ownerId`, `createdAt`,
`updatedAt`, todos com `@ApiProperty()` (padrão `UserResponseDto`).

**`PaginatedResponseDto<T>`** (em `common/dto/`, compartilhado — não específico de `Project`) —
`items: T[]`, `meta: { page, limit, total, totalPages }`
(`ADR-010`).

---

## Autorização (resumo — detalhado na `ADR-009`)

- Qualquer usuário autenticado pode criar projetos.
- Dono ou `ADMIN`/`SUPER_ADMIN` pode ler/editar/arquivar/restaurar um projeto específico.
- Listagem sempre filtra por `ownerId` do usuário autenticado, independente de papel (não há
  "listar projetos de todo mundo" nesta sprint — YAGNI; um painel administrativo é uma
  funcionalidade própria, não um efeito colateral do RBAC existente).

---

## Plano de Testes

### Unitários

- `ProjectsService`: criação (owner = usuário autenticado), atualização parcial, `archive`
  (sucesso e conflito em já-arquivado), `restore` (sucesso e conflito em já-ativo), listagem
  (delegação de paginação/filtro ao repository).
- `ProjectsRepository`: cada método isolado com mock do `PrismaService` (padrão já usado em
  `UsersRepository`).
- `ProjectOwnershipGuard`: dono permite; `ADMIN`/`SUPER_ADMIN` permite mesmo sem ser dono; outro
  `USER` nega (`403`); projeto inexistente (`404`, não `403`).
- `ProjectsController`: delegação para o Service (padrão já usado em `AuthController`/
  `UsersController` — sem lógica de negócio no Controller).

### E2E

- Fluxo completo: criar → listar (aparece) → detalhar → editar → arquivar (aparece só com
  `?status=ARCHIVED` ou `ALL`) → restaurar (volta a aparecer no filtro padrão).
- **Isolamento entre usuários** (cobertura central da `ADR-009`): usuário B tenta
  ler/editar/arquivar projeto do usuário A → `403` em todos os casos; usuário B não vê projeto de
  A na própria listagem.
- `ADMIN`/`SUPER_ADMIN` acessando projeto de outro usuário → permitido.
- Paginação: criar N projetos, validar `meta.total`/`meta.totalPages` e que `limit` é respeitado.
- Validação: `POST` sem `name` → `400`, formato de erro conforme `AllExceptionsFilter` (`ADR-007`).
- `archive` em projeto já arquivado → `409`.

---

## Critérios de Aceite

- Todas as rotas da tabela de contrato REST funcionando sob `/v1/projects`.
- Isolamento por `ownerId` comprovado por teste E2E (não só por leitura de código).
- `ADMIN`/`SUPER_ADMIN` com acesso administrativo comprovado por teste E2E.
- Nenhum `DELETE` físico exposto.
- `lint`, testes unitários, `build` verdes em todos os blocos; E2E completo ao final do Bloco C
  (única camada com superfície HTTP) — mesmo padrão de rigor da SPR-008, adaptado à diferença
  estrutural de que `ProjectsController` só existe no último bloco (ver
  `engineering/backlog/SPR-009.md`).
- Documentação (`README.md`, `PROJECT_STATUS.md`, `CHANGELOG.md`, Swagger) atualizada junto da
  implementação, não depois.
