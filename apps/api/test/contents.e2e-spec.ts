import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/modules/users/users.service';
import { Role } from '../generated/prisma/client';

/** Formato padrão de resposta de sucesso desde o Bloco B da SPR-008 (ADR-007). */
interface SuccessEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ErrorEnvelope {
  success: false;
  error: { statusCode: number; error: string; message: string | string[] };
  path: string;
  timestamp: string;
}

interface AuthResponseBody {
  accessToken: string;
  refreshToken: string;
}

interface ProjectResponseBody {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignResponseBody {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentResponseBody {
  id: string;
  name: string;
  body: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedContentsBody {
  items: ContentResponseBody[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Cobre o plano de testes E2E do SPR-013, Bloco C: fluxo completo,
 * isolamento entre usuários e proteção IDOR (`ADR-012`) — incluindo a
 * variação de dois saltos própria de `Content` (Content → Campaign →
 * Project) —, acesso administrativo, paginação/filtro por status,
 * validação de entrada e conflito de estado. Mesmo padrão estrutural de
 * `campaigns.e2e-spec.ts`, um nível mais fundo na hierarquia.
 *
 * Requer um Postgres real com as migrations aplicadas e o Prisma Client
 * regenerado — mesmo pré-requisito de `campaigns.e2e-spec.ts`.
 */
describe('Contents (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let usersService: UsersService;

  const suffix = Date.now();
  const userA = {
    email: `contents-e2e-a-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuária A',
  };
  const userB = {
    email: `contents-e2e-b-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuário B',
  };
  const adminUser = {
    email: `contents-e2e-admin-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Admin',
  };
  const superAdminUser = {
    email: `contents-e2e-superadmin-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Super Admin',
  };
  const paginationUser = {
    email: `contents-e2e-pagination-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuária Paginação',
  };

  let userAId: string;
  let userBId: string;
  let adminUserId: string;
  let superAdminUserId: string;
  let paginationUserId: string;

  let tokenA: string;
  let tokenB: string;
  let adminToken: string;
  let superAdminToken: string;
  let paginationToken: string;

  // Project pai de A, usado na maioria dos cenários de Content.
  let projectAId: string;
  // Project pai de B, usado nos cenários de isolamento/IDOR entre usuários.
  let projectBId: string;
  // Project dedicado à usuária de paginação.
  let paginationProjectId: string;

  // Campaign principal de A, usada na maioria dos cenários de Content.
  let campaignAId: string;
  // Segunda Campaign de A (mesmo Project), usada no cenário de IDOR
  // "campaignId de outra Campaign do próprio usuário".
  let campaignA2Id: string;
  // Campaign de B, usada nos cenários de isolamento/IDOR entre usuários.
  let campaignBId: string;
  // Campaign dedicada da usuária de paginação.
  let paginationCampaignId: string;

  async function login(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(200);

    return (response.body as SuccessEnvelope<AuthResponseBody>).data
      .accessToken;
  }

  async function createProject(token: string, name: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name })
      .expect(201);

    return (response.body as SuccessEnvelope<ProjectResponseBody>).data.id;
  }

  async function createCampaign(
    token: string,
    projectId: string,
    name: string,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(`/v1/projects/${projectId}/campaigns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name })
      .expect(201);

    return (response.body as SuccessEnvelope<CampaignResponseBody>).data.id;
  }

  async function createContent(
    token: string,
    campaignId: string,
    body: { name: string; body?: string },
  ): Promise<ContentResponseBody> {
    const response = await request(app.getHttpServer())
      .post(`/v1/campaigns/${campaignId}/contents`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);

    return (response.body as SuccessEnvelope<ContentResponseBody>).data;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    usersService = moduleFixture.get(UsersService);

    const createdA = await usersService.create(userA);
    const createdB = await usersService.create(userB);
    const createdAdmin = await usersService.create(adminUser);
    const createdSuperAdmin = await usersService.create(superAdminUser);
    const createdPagination = await usersService.create(paginationUser);

    userAId = createdA.id;
    userBId = createdB.id;
    adminUserId = createdAdmin.id;
    superAdminUserId = createdSuperAdmin.id;
    paginationUserId = createdPagination.id;

    // Sem endpoint HTTP para promover papel (fora de escopo desta sprint)
    // — ajuste direto via Prisma, só para o setup do teste, mesmo padrão
    // já usado em campaigns.e2e-spec.ts.
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: Role.ADMIN },
    });
    await prisma.user.update({
      where: { id: superAdminUserId },
      data: { role: Role.SUPER_ADMIN },
    });

    tokenA = await login(userA.email, userA.password);
    tokenB = await login(userB.email, userB.password);
    adminToken = await login(adminUser.email, adminUser.password);
    superAdminToken = await login(
      superAdminUser.email,
      superAdminUser.password,
    );
    paginationToken = await login(
      paginationUser.email,
      paginationUser.password,
    );

    projectAId = await createProject(tokenA, 'Projeto A (Contents E2E)');
    projectBId = await createProject(tokenB, 'Projeto B (Contents E2E)');
    paginationProjectId = await createProject(
      paginationToken,
      'Projeto Paginação (Contents E2E)',
    );

    campaignAId = await createCampaign(
      tokenA,
      projectAId,
      'Campanha A1 (Contents E2E)',
    );
    campaignA2Id = await createCampaign(
      tokenA,
      projectAId,
      'Campanha A2 (Contents E2E)',
    );
    campaignBId = await createCampaign(
      tokenB,
      projectBId,
      'Campanha B (Contents E2E)',
    );
    paginationCampaignId = await createCampaign(
      paginationToken,
      paginationProjectId,
      'Campanha Paginação (Contents E2E)',
    );
  });

  afterAll(async () => {
    const projectIds = [projectAId, projectBId, paginationProjectId];
    const ownerIds = [
      userAId,
      userBId,
      adminUserId,
      superAdminUserId,
      paginationUserId,
    ];

    // Content.campaignId e Campaign.projectId são FKs sem cascade —
    // apagar contents antes de campaigns, campaigns antes de projects, e
    // projects antes dos usuários donos (mesma ordem de
    // campaigns.e2e-spec.ts, um nível mais fundo).
    await prisma.content.deleteMany({
      where: { campaign: { projectId: { in: projectIds } } },
    });
    await prisma.campaign.deleteMany({
      where: { projectId: { in: projectIds } },
    });
    await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ownerIds } } });
    await app.close();
  });

  describe('Autenticação', () => {
    it('POST sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents`)
        .send({ name: 'Sem autenticação' })
        .expect(401);
    });

    it('GET (listagem) sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents`)
        .expect(401);
    });

    it('GET (detalhe) com token inválido retorna 401', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents/qualquer-id`)
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });

  describe('Criação', () => {
    it('owner cria conteúdo em sua própria campanha', async () => {
      const content = await createContent(tokenA, campaignAId, {
        name: 'Conteúdo do Owner',
        body: 'corpo do conteúdo',
      });

      expect(content.name).toBe('Conteúdo do Owner');
      expect(content.status).toBe('ACTIVE');
      expect(content.campaignId).toBe(campaignAId);
    });

    it('ADMIN cria conteúdo na campanha de outro usuário', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Conteúdo criado pelo Admin' })
        .expect(201);

      const body = (response.body as SuccessEnvelope<ContentResponseBody>).data;
      expect(body.campaignId).toBe(campaignAId);
    });

    it('SUPER_ADMIN cria conteúdo na campanha de outro usuário', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Conteúdo criado pelo Super Admin' })
        .expect(201);

      const body = (response.body as SuccessEnvelope<ContentResponseBody>).data;
      expect(body.campaignId).toBe(campaignAId);
    });

    it('USER não proprietário da campanha (via Project) recebe 404', async () => {
      await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Tentativa de invasão' })
        .expect(404);
    });

    it('campanha inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .post('/v1/campaigns/campanha-que-nao-existe/contents')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Conteúdo órfão' })
        .expect(404);
    });

    it('payload inválido (sem name) retorna 400', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ body: 'sem nome' })
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);
      expect(body.error.message).toEqual(
        expect.arrayContaining([expect.stringContaining('name')]),
      );
    });
  });

  describe('Listagem', () => {
    let listCampaignId: string;

    beforeAll(async () => {
      listCampaignId = await createCampaign(
        tokenA,
        projectAId,
        'Campanha Listagem A',
      );
      await createContent(tokenA, listCampaignId, { name: 'Ativo 1' });
      await createContent(tokenA, listCampaignId, { name: 'Ativo 2' });
      const toArchive = await createContent(tokenA, listCampaignId, {
        name: 'Será arquivado',
      });
      await request(app.getHttpServer())
        .post(
          `/v1/campaigns/${listCampaignId}/contents/${toArchive.id}/archive`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
    });

    afterAll(async () => {
      await prisma.content.deleteMany({
        where: { campaignId: listCampaignId },
      });
      await prisma.campaign.delete({ where: { id: listCampaignId } });
    });

    it('owner lista os conteúdos da própria campanha', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${listCampaignId}/contents`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedContentsBody>)
        .data;
      expect(body.items.map((c) => c.name)).toEqual(
        expect.arrayContaining(['Ativo 1', 'Ativo 2']),
      );
    });

    it('ADMIN lista os conteúdos de uma campanha de outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${listCampaignId}/contents`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('SUPER_ADMIN lista os conteúdos de uma campanha de outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${listCampaignId}/contents`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('usuário sem ownership recebe 404 ao tentar listar', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${listCampaignId}/contents`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('campanha inexistente retorna 404 ao tentar listar', async () => {
      await request(app.getHttpServer())
        .get('/v1/campaigns/campanha-que-nao-existe/contents')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('status omitido retorna apenas ACTIVE', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${listCampaignId}/contents`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedContentsBody>)
        .data;
      expect(body.items.map((c) => c.name)).not.toContain('Será arquivado');
    });

    it('status=ALL retorna ACTIVE + ARCHIVED', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${listCampaignId}/contents?status=ALL`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedContentsBody>)
        .data;
      expect(body.items.map((c) => c.name)).toEqual(
        expect.arrayContaining(['Ativo 1', 'Ativo 2', 'Será arquivado']),
      );
    });

    it('status=ARCHIVED retorna somente arquivados', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${listCampaignId}/contents?status=ARCHIVED`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedContentsBody>)
        .data;
      expect(body.items.map((c) => c.name)).toEqual(['Será arquivado']);
    });

    it('paginação respeita limit e calcula meta.total/meta.totalPages', async () => {
      for (let i = 0; i < 5; i += 1) {
        await createContent(paginationToken, paginationCampaignId, {
          name: `Conteúdo Paginado ${i}`,
        });
      }

      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${paginationCampaignId}/contents?page=1&limit=2`)
        .set('Authorization', `Bearer ${paginationToken}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedContentsBody>)
        .data;
      expect(body.items).toHaveLength(2);
      expect(body.meta).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });
  });

  describe('Busca', () => {
    let contentId: string;

    beforeAll(async () => {
      const content = await createContent(tokenA, campaignAId, {
        name: 'Conteúdo Para Busca',
      });
      contentId = content.id;
    });

    it('owner obtém o conteúdo', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents/${contentId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<ContentResponseBody>).data;
      expect(body.id).toBe(contentId);
    });

    it('ADMIN obtém o conteúdo de outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents/${contentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('SUPER_ADMIN obtém o conteúdo de outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents/${contentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('conteúdo inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents/id-que-nao-existe`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('campanha inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/campanha-que-nao-existe/contents/${contentId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('conteúdo pertencente a outra campanha (mesmo dono) retorna 404', async () => {
      // ADR-012, seção 4, passo 2: content.campaignId !== params.campaignId
      // encerra a validação antes de qualquer consulta adicional, mesmo
      // quando o usuário autenticado é dono de ambas as campanhas.
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignA2Id}/contents/${contentId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('usuário sem ownership recebe 404 (não 403)', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents/${contentId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('IDOR — Content.campaignId × :campaignId da rota (ADR-012)', () => {
    let contentOfA: string;

    beforeAll(async () => {
      const content = await createContent(tokenA, campaignAId, {
        name: 'Conteúdo de A (alvo do IDOR)',
      });
      contentOfA = content.id;
    });

    it('GET: usuário B, dono da Campaign B, não acessa o conteúdo de A combinando seu campaignId com o id do conteúdo de A', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignBId}/contents/${contentOfA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(404);
    });

    it('PATCH: mesma combinação IDOR entre usuários também é bloqueada', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignBId}/contents/${contentOfA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Tentativa de alteração via IDOR' })
        .expect(404);
    });

    it('archive: mesma combinação IDOR entre usuários também é bloqueada', async () => {
      await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignBId}/contents/${contentOfA}/archive`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('GET: o próprio usuário A não acessa o conteúdo combinando o campaignId de OUTRA campanha sua com o id do conteúdo', async () => {
      // Caso obrigatório do escopo do Bloco C: :campaignId de outra
      // Campaign do próprio usuário (campaignA2Id), não apenas de outro
      // usuário — content.campaignId !== params.campaignId já é
      // suficiente para 404, mesmo com ownership da cadeia válida para
      // ambas as campanhas.
      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignA2Id}/contents/${contentOfA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(404);
    });

    it('PATCH: mesma combinação IDOR com campanha própria também é bloqueada', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignA2Id}/contents/${contentOfA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Tentativa de alteração via IDOR (campanha própria)' })
        .expect(404);
    });

    it('archive: mesma combinação IDOR com campanha própria também é bloqueada', async () => {
      await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignA2Id}/contents/${contentOfA}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('confirma que o conteúdo de A não foi exposto nem alterado pelas tentativas de IDOR', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents/${contentOfA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<ContentResponseBody>).data;
      expect(body.name).toBe('Conteúdo de A (alvo do IDOR)');
      expect(body.status).toBe('ACTIVE');
    });
  });

  describe('Project ancestral inexistente (ADR-012)', () => {
    it('campanha íntegra cujo Project foi removido (dado corrompido/órfão) retorna 404 ao buscar conteúdo', async () => {
      // Cenário defendido explicitamente pela tabela da ADR-012, seção 2,
      // mas não alcançável via fluxo HTTP normal: toda Campaign criada
      // pela API sempre referencia um Project existente (FK RESTRICT).
      // Simula-se aqui o único jeito desse estado existir na prática —
      // corrupção/dados órfãos — desabilitando temporariamente o gatilho
      // de FK RESTRICT em `projects` (o gatilho que impede o DELETE fica
      // na tabela *referenciada*, não na referenciadora) só para permitir
      // o DELETE físico do Project de teste, restaurando o gatilho em
      // seguida. Requer um papel de banco com privilégio de superusuário
      // — gatilhos de FK só podem ser desabilitados por superuser no
      // Postgres, mesmo pelo dono da tabela; documentar isso é
      // responsabilidade deste teste, não do Bloco A/B. Não usa
      // `ContentsRepository`/`CampaignsRepository`/`ProjectsRepository`
      // nem altera nada do Bloco A/B — é manipulação direta de dados de
      // teste via Prisma, mesmo espírito de `prisma.user.update` usado
      // acima para promover papel.
      const orphanProjectId = await createProject(
        tokenA,
        'Projeto Órfão (Contents E2E)',
      );
      const orphanCampaignId = await createCampaign(
        tokenA,
        orphanProjectId,
        'Campanha Órfã (Contents E2E)',
      );
      const orphanContent = await createContent(tokenA, orphanCampaignId, {
        name: 'Conteúdo Órfão',
      });

      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('ALTER TABLE projects DISABLE TRIGGER ALL');
        await tx.$executeRawUnsafe(
          'DELETE FROM projects WHERE id = $1',
          orphanProjectId,
        );
        await tx.$executeRawUnsafe('ALTER TABLE projects ENABLE TRIGGER ALL');
      });

      const response = await request(app.getHttpServer())
        .get(`/v1/campaigns/${orphanCampaignId}/contents/${orphanContent.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(404);

      // Limpeza: o Project já não existe, então só resta apagar o
      // Content e a Campaign órfãos diretamente.
      await prisma.content.deleteMany({
        where: { campaignId: orphanCampaignId },
      });
      await prisma.campaign.delete({ where: { id: orphanCampaignId } });
    });
  });

  describe('Update', () => {
    let contentId: string;

    beforeEach(async () => {
      const content = await createContent(tokenA, campaignAId, {
        name: 'Conteúdo Para Update',
        body: 'corpo original',
      });
      contentId = content.id;
    });

    it('owner atualiza o nome', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignAId}/contents/${contentId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      const body = (response.body as SuccessEnvelope<ContentResponseBody>).data;
      expect(body.name).toBe('Nome Atualizado');
      expect(body.body).toBe('corpo original');
    });

    it('owner atualiza o body', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignAId}/contents/${contentId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ body: 'Novo corpo' })
        .expect(200);

      const body = (response.body as SuccessEnvelope<ContentResponseBody>).data;
      expect(body.body).toBe('Novo corpo');
    });

    it('owner atualiza ambos os campos', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignAId}/contents/${contentId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Ambos', body: 'Ambos também' })
        .expect(200);

      const body = (response.body as SuccessEnvelope<ContentResponseBody>).data;
      expect(body.name).toBe('Ambos');
      expect(body.body).toBe('Ambos também');
    });

    it('payload sem campos retorna 400 (regra de negócio do Service, Bloco B)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignAId}/contents/${contentId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({})
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);
    });

    it('conteúdo inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignAId}/contents/id-que-nao-existe`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Não importa' })
        .expect(404);
    });

    it('usuário sem ownership recebe 404', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignAId}/contents/${contentId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Tentativa de invasão' })
        .expect(404);
    });
  });

  describe('Archive', () => {
    it('ACTIVE → ARCHIVED', async () => {
      const content = await createContent(tokenA, campaignAId, {
        name: 'Conteúdo Para Arquivar',
      });

      const response = await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents/${content.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<ContentResponseBody>).data;
      expect(body.status).toBe('ARCHIVED');
    });

    it('segunda tentativa de archive retorna 409', async () => {
      const content = await createContent(tokenA, campaignAId, {
        name: 'Conteúdo Para Testar Conflito',
      });

      await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents/${content.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents/${content.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(409);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(409);
    });

    it('conteúdo inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents/id-que-nao-existe/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('usuário sem ownership recebe 404', async () => {
      const content = await createContent(tokenA, campaignAId, {
        name: 'Conteúdo Protegido de Archive Indevido',
      });

      await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents/${content.id}/archive`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('Integridade', () => {
    it('campaignId do conteúdo vem da rota, não do body', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents`)
        .set('Authorization', `Bearer ${tokenA}`)
        // `forbidNonWhitelisted` (ADR-003) rejeita `campaignId` no body,
        // já que não é um campo de `CreateContentDto`.
        .send({ name: 'Conteúdo Íntegro', campaignId: campaignBId })
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);
    });

    it('não é possível alterar o vínculo do conteúdo com outra campanha via PATCH', async () => {
      const content = await createContent(tokenA, campaignAId, {
        name: 'Conteúdo Original',
      });

      const response = await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignAId}/contents/${content.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        // `UpdateContentDto` não tem `campaignId` — `forbidNonWhitelisted`
        // rejeita a propriedade desconhecida.
        .send({ name: 'Conteúdo Renomeado', campaignId: campaignBId })
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);

      const stillOfA = await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents/${content.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const stillOfABody = (
        stillOfA.body as SuccessEnvelope<ContentResponseBody>
      ).data;
      expect(stillOfABody.campaignId).toBe(campaignAId);
      expect(stillOfABody.name).toBe('Conteúdo Original');
    });

    it('ContentResponseDto não expõe ownerId nem projectId, em nenhuma rota', async () => {
      // ADR-012: Content não tem ownerId próprio, e a rota de Content não
      // expõe :projectId na URL — o vínculo público exposto é apenas
      // campaignId (o pai imediato). Cobre create, findOne, list, update
      // e archive, já que cada um monta a resposta de forma independente
      // a partir de ContentResponseDto.fromEntity.
      const created = await createContent(tokenA, campaignAId, {
        name: 'Conteúdo Sem Vazamento',
      });
      expect(created).not.toHaveProperty('ownerId');
      expect(created).not.toHaveProperty('projectId');

      const findOneResponse = await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const findOneBody = (
        findOneResponse.body as SuccessEnvelope<ContentResponseBody>
      ).data;
      expect(findOneBody).not.toHaveProperty('ownerId');
      expect(findOneBody).not.toHaveProperty('projectId');

      const listResponse = await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignAId}/contents`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const listBody = (
        listResponse.body as SuccessEnvelope<PaginatedContentsBody>
      ).data;
      for (const item of listBody.items) {
        expect(item).not.toHaveProperty('ownerId');
        expect(item).not.toHaveProperty('projectId');
      }

      const updateResponse = await request(app.getHttpServer())
        .patch(`/v1/campaigns/${campaignAId}/contents/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Conteúdo Sem Vazamento (renomeado)' })
        .expect(200);
      const updateBody = (
        updateResponse.body as SuccessEnvelope<ContentResponseBody>
      ).data;
      expect(updateBody).not.toHaveProperty('ownerId');
      expect(updateBody).not.toHaveProperty('projectId');

      const archiveResponse = await request(app.getHttpServer())
        .post(`/v1/campaigns/${campaignAId}/contents/${created.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const archiveBody = (
        archiveResponse.body as SuccessEnvelope<ContentResponseBody>
      ).data;
      expect(archiveBody).not.toHaveProperty('ownerId');
      expect(archiveBody).not.toHaveProperty('projectId');
    });
  });
});
