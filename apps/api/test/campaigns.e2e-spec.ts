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

interface PaginatedCampaignsBody {
  items: CampaignResponseBody[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Cobre o plano de testes E2E do SPR-012, Bloco C: fluxo completo,
 * isolamento entre usuários e proteção IDOR (`ADR-011`), acesso
 * administrativo, paginação/filtro por status, validação de entrada e
 * conflito de estado.
 *
 * Requer um Postgres real com as migrations aplicadas e o Prisma Client
 * regenerado — mesmo pré-requisito de `projects.e2e-spec.ts`.
 */
describe('Campaigns (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let usersService: UsersService;

  const suffix = Date.now();
  const userA = {
    email: `campaigns-e2e-a-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuária A',
  };
  const userB = {
    email: `campaigns-e2e-b-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuário B',
  };
  const adminUser = {
    email: `campaigns-e2e-admin-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Admin',
  };
  const superAdminUser = {
    email: `campaigns-e2e-superadmin-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Super Admin',
  };
  const paginationUser = {
    email: `campaigns-e2e-pagination-${suffix}@example.com`,
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

  // Project pai de A, usado na maioria dos cenários de Campaign.
  let projectAId: string;
  // Project pai de B, usado nos cenários de isolamento/IDOR.
  let projectBId: string;
  // Project dedicado à usuária de paginação.
  let paginationProjectId: string;

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
    body: { name: string; description?: string },
  ): Promise<CampaignResponseBody> {
    const response = await request(app.getHttpServer())
      .post(`/v1/projects/${projectId}/campaigns`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);

    return (response.body as SuccessEnvelope<CampaignResponseBody>).data;
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
    // já usado em projects.e2e-spec.ts.
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

    projectAId = await createProject(tokenA, 'Projeto A (Campaigns E2E)');
    projectBId = await createProject(tokenB, 'Projeto B (Campaigns E2E)');
    paginationProjectId = await createProject(
      paginationToken,
      'Projeto Paginação (Campaigns E2E)',
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

    // Campaign.projectId é FK sem cascade — apagar campanhas antes dos
    // projetos, e projetos antes dos usuários donos (mesma ordem de
    // projects.e2e-spec.ts, um nível mais fundo).
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
        .post(`/v1/projects/${projectAId}/campaigns`)
        .send({ name: 'Sem autenticação' })
        .expect(401);
    });

    it('GET (listagem) sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${projectAId}/campaigns`)
        .expect(401);
    });

    it('GET (detalhe) com token inválido retorna 401', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${projectAId}/campaigns/qualquer-id`)
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });

  describe('Criação', () => {
    it('owner cria campanha em seu próprio projeto', async () => {
      const campaign = await createCampaign(tokenA, projectAId, {
        name: 'Campanha do Owner',
        description: 'desc',
      });

      expect(campaign.name).toBe('Campanha do Owner');
      expect(campaign.status).toBe('ACTIVE');
      expect(campaign.projectId).toBe(projectAId);
    });

    it('ADMIN cria campanha no projeto de outro usuário', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Campanha criada pelo Admin' })
        .expect(201);

      const body = (response.body as SuccessEnvelope<CampaignResponseBody>)
        .data;
      expect(body.projectId).toBe(projectAId);
    });

    it('SUPER_ADMIN cria campanha no projeto de outro usuário', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Campanha criada pelo Super Admin' })
        .expect(201);

      const body = (response.body as SuccessEnvelope<CampaignResponseBody>)
        .data;
      expect(body.projectId).toBe(projectAId);
    });

    it('USER não proprietário do projeto recebe 404', async () => {
      await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Tentativa de invasão' })
        .expect(404);
    });

    it('projeto inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .post('/v1/projects/projeto-que-nao-existe/campaigns')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Campanha órfã' })
        .expect(404);
    });

    it('payload inválido (sem name) retorna 400', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ description: 'sem nome' })
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
    let listProjectId: string;

    beforeAll(async () => {
      listProjectId = await createProject(tokenA, 'Projeto Listagem A');
      await createCampaign(tokenA, listProjectId, { name: 'Ativa 1' });
      await createCampaign(tokenA, listProjectId, { name: 'Ativa 2' });
      const toArchive = await createCampaign(tokenA, listProjectId, {
        name: 'Será arquivada',
      });
      await request(app.getHttpServer())
        .post(`/v1/projects/${listProjectId}/campaigns/${toArchive.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
    });

    afterAll(async () => {
      await prisma.campaign.deleteMany({
        where: { projectId: listProjectId },
      });
      await prisma.project.delete({ where: { id: listProjectId } });
    });

    it('owner lista as campanhas do próprio projeto', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${listProjectId}/campaigns`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedCampaignsBody>)
        .data;
      expect(body.items.map((c) => c.name)).toEqual(
        expect.arrayContaining(['Ativa 1', 'Ativa 2']),
      );
    });

    it('ADMIN lista as campanhas de um projeto de outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${listProjectId}/campaigns`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('SUPER_ADMIN lista as campanhas de um projeto de outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${listProjectId}/campaigns`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('usuário sem ownership recebe 404 ao tentar listar', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${listProjectId}/campaigns`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('status omitido retorna apenas ACTIVE', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${listProjectId}/campaigns`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedCampaignsBody>)
        .data;
      expect(body.items.map((c) => c.name)).not.toContain('Será arquivada');
    });

    it('status=ALL retorna ACTIVE + ARCHIVED', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${listProjectId}/campaigns?status=ALL`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedCampaignsBody>)
        .data;
      expect(body.items.map((c) => c.name)).toEqual(
        expect.arrayContaining(['Ativa 1', 'Ativa 2', 'Será arquivada']),
      );
    });

    it('status=ARCHIVED retorna somente arquivadas', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${listProjectId}/campaigns?status=ARCHIVED`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedCampaignsBody>)
        .data;
      expect(body.items.map((c) => c.name)).toEqual(['Será arquivada']);
    });

    it('paginação respeita limit e calcula meta.total/meta.totalPages', async () => {
      for (let i = 0; i < 5; i += 1) {
        await createCampaign(paginationToken, paginationProjectId, {
          name: `Campanha Paginada ${i}`,
        });
      }

      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${paginationProjectId}/campaigns?page=1&limit=2`)
        .set('Authorization', `Bearer ${paginationToken}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedCampaignsBody>)
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
    let campaignId: string;

    beforeAll(async () => {
      const campaign = await createCampaign(tokenA, projectAId, {
        name: 'Campanha Para Busca',
      });
      campaignId = campaign.id;
    });

    it('owner obtém a campanha', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${projectAId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<CampaignResponseBody>)
        .data;
      expect(body.id).toBe(campaignId);
    });

    it('ADMIN obtém a campanha de outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${projectAId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('SUPER_ADMIN obtém a campanha de outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${projectAId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('campanha inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${projectAId}/campaigns/id-que-nao-existe`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('projeto inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/projeto-que-nao-existe/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('usuário sem ownership recebe 404 (não 403)', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${projectAId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('IDOR — Campaign.projectId × :projectId da rota (ADR-011)', () => {
    let campaignOfA: string;

    beforeAll(async () => {
      const campaign = await createCampaign(tokenA, projectAId, {
        name: 'Campanha de A (alvo do IDOR)',
      });
      campaignOfA = campaign.id;
    });

    it('GET: usuário B, dono do Project B, não acessa a campanha de A combinando seu projectId com o id da campanha de A', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${projectBId}/campaigns/${campaignOfA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(404);
    });

    it('PATCH: mesma combinação IDOR também é bloqueada', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/projects/${projectBId}/campaigns/${campaignOfA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Tentativa de alteração via IDOR' })
        .expect(404);
    });

    it('archive: mesma combinação IDOR também é bloqueada', async () => {
      await request(app.getHttpServer())
        .post(`/v1/projects/${projectBId}/campaigns/${campaignOfA}/archive`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('confirma que a campanha de A não foi exposta nem alterada pelas tentativas de IDOR', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${projectAId}/campaigns/${campaignOfA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<CampaignResponseBody>)
        .data;
      expect(body.name).toBe('Campanha de A (alvo do IDOR)');
      expect(body.status).toBe('ACTIVE');
    });
  });

  describe('Update', () => {
    let campaignId: string;

    beforeEach(async () => {
      const campaign = await createCampaign(tokenA, projectAId, {
        name: 'Campanha Para Update',
        description: 'descrição original',
      });
      campaignId = campaign.id;
    });

    it('owner atualiza o nome', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/projects/${projectAId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      const body = (response.body as SuccessEnvelope<CampaignResponseBody>)
        .data;
      expect(body.name).toBe('Nome Atualizado');
      expect(body.description).toBe('descrição original');
    });

    it('owner atualiza a descrição', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/projects/${projectAId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ description: 'Nova descrição' })
        .expect(200);

      const body = (response.body as SuccessEnvelope<CampaignResponseBody>)
        .data;
      expect(body.description).toBe('Nova descrição');
    });

    it('owner atualiza ambos os campos', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/projects/${projectAId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Ambos', description: 'Ambos também' })
        .expect(200);

      const body = (response.body as SuccessEnvelope<CampaignResponseBody>)
        .data;
      expect(body.name).toBe('Ambos');
      expect(body.description).toBe('Ambos também');
    });

    it('payload sem campos retorna 400 (regra de negócio do Service, Bloco B)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/projects/${projectAId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({})
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);
    });

    it('campanha inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/projects/${projectAId}/campaigns/id-que-nao-existe`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Não importa' })
        .expect(404);
    });

    it('usuário sem ownership recebe 404', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/projects/${projectAId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Tentativa de invasão' })
        .expect(404);
    });
  });

  describe('Archive', () => {
    it('ACTIVE → ARCHIVED', async () => {
      const campaign = await createCampaign(tokenA, projectAId, {
        name: 'Campanha Para Arquivar',
      });

      const response = await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns/${campaign.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<CampaignResponseBody>)
        .data;
      expect(body.status).toBe('ARCHIVED');
    });

    it('segunda tentativa de archive retorna 409', async () => {
      const campaign = await createCampaign(tokenA, projectAId, {
        name: 'Campanha Para Testar Conflito',
      });

      await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns/${campaign.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns/${campaign.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(409);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(409);
    });

    it('campanha inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns/id-que-nao-existe/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('usuário sem ownership recebe 404', async () => {
      const campaign = await createCampaign(tokenA, projectAId, {
        name: 'Campanha Protegida de Archive Indevido',
      });

      await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns/${campaign.id}/archive`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('Integridade', () => {
    it('projectId da campanha vem da rota, não do body', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/projects/${projectAId}/campaigns`)
        .set('Authorization', `Bearer ${tokenA}`)
        // `forbidNonWhitelisted` (ADR-003) rejeita `projectId` no body,
        // já que não é um campo de `CreateCampaignDto`.
        .send({ name: 'Campanha Íntegra', projectId: projectBId })
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);
    });

    it('não é possível alterar o vínculo da campanha com outro projeto via PATCH', async () => {
      const campaign = await createCampaign(tokenA, projectAId, {
        name: 'Campanha Original',
      });

      const response = await request(app.getHttpServer())
        .patch(`/v1/projects/${projectAId}/campaigns/${campaign.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        // `UpdateCampaignDto` não tem `projectId` — `forbidNonWhitelisted`
        // rejeita a propriedade desconhecida.
        .send({ name: 'Campanha Renomeada', projectId: projectBId })
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);

      const stillOfA = await request(app.getHttpServer())
        .get(`/v1/projects/${projectAId}/campaigns/${campaign.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const stillOfABody = (
        stillOfA.body as SuccessEnvelope<CampaignResponseBody>
      ).data;
      expect(stillOfABody.projectId).toBe(projectAId);
      expect(stillOfABody.name).toBe('Campanha Original');
    });
  });
});
