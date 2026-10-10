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
}

interface CampaignResponseBody {
  id: string;
}

interface ContentResponseBody {
  id: string;
}

interface PublicationResponseBody {
  id: string;
  channel: 'INSTAGRAM';
  status: 'DRAFT' | 'SCHEDULED';
  scheduledAt: string | null;
  contentId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedPublicationsBody {
  items: PublicationResponseBody[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Cobre o plano de testes E2E da SPR-014, Bloco C: fluxo completo,
 * isolamento entre usuários e proteção IDOR (`ADR-013`) — incluindo a
 * cadeia de três saltos própria de `Publication` (Publication → Content →
 * Campaign → Project) —, validação de lifecycle (`DRAFT ⇄ SCHEDULED`) via
 * `PATCH`, e `forbidNonWhitelisted` para `scheduledAt` na criação. Mesmo
 * padrão estrutural de `contents.e2e-spec.ts`, um nível mais fundo na
 * hierarquia.
 *
 * Requer um Postgres real com as migrations aplicadas e o Prisma Client
 * regenerado — mesmo pré-requisito de `contents.e2e-spec.ts`.
 */
describe('Publications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let usersService: UsersService;

  const suffix = Date.now();
  const userA = {
    email: `publications-e2e-a-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuária A',
  };
  const userB = {
    email: `publications-e2e-b-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuário B',
  };
  const adminUser = {
    email: `publications-e2e-admin-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Admin',
  };

  let userAId: string;
  let userBId: string;
  let adminUserId: string;

  let tokenA: string;
  let tokenB: string;
  let adminToken: string;

  let projectAId: string;
  let projectBId: string;
  let campaignAId: string;
  // Segunda Campaign de A (mesmo Project), usada no cenário de IDOR
  // "campaignId de outra Campaign do próprio usuário".
  let campaignA2Id: string;
  let campaignBId: string;
  let contentAId: string;
  let contentBId: string;

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
    name: string,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(`/v1/campaigns/${campaignId}/contents`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name })
      .expect(201);

    return (response.body as SuccessEnvelope<ContentResponseBody>).data.id;
  }

  async function createPublication(
    token: string,
    campaignId: string,
    contentId: string,
  ): Promise<PublicationResponseBody> {
    const response = await request(app.getHttpServer())
      .post(`/v1/campaigns/${campaignId}/contents/${contentId}/publications`)
      .set('Authorization', `Bearer ${token}`)
      .send({ channel: 'INSTAGRAM' })
      .expect(201);

    return (response.body as SuccessEnvelope<PublicationResponseBody>).data;
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

    userAId = createdA.id;
    userBId = createdB.id;
    adminUserId = createdAdmin.id;

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: Role.ADMIN },
    });

    tokenA = await login(userA.email, userA.password);
    tokenB = await login(userB.email, userB.password);
    adminToken = await login(adminUser.email, adminUser.password);

    projectAId = await createProject(tokenA, 'Projeto A (Publications E2E)');
    projectBId = await createProject(tokenB, 'Projeto B (Publications E2E)');

    campaignAId = await createCampaign(
      tokenA,
      projectAId,
      'Campanha A1 (Publications E2E)',
    );
    campaignA2Id = await createCampaign(
      tokenA,
      projectAId,
      'Campanha A2 (Publications E2E)',
    );
    campaignBId = await createCampaign(
      tokenB,
      projectBId,
      'Campanha B (Publications E2E)',
    );

    contentAId = await createContent(
      tokenA,
      campaignAId,
      'Conteúdo A (Publications E2E)',
    );
    contentBId = await createContent(
      tokenB,
      campaignBId,
      'Conteúdo B (Publications E2E)',
    );
  });

  afterAll(async () => {
    const projectIds = [projectAId, projectBId];
    const ownerIds = [userAId, userBId, adminUserId];

    await prisma.publication.deleteMany({
      where: { content: { campaign: { projectId: { in: projectIds } } } },
    });
    await prisma.content.deleteMany({
      where: { campaign: { projectId: { in: projectIds } } },
    });
    await prisma.campaign.deleteMany({
      where: { projectId: { in: projectIds } },
    });
    await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: ownerIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: ownerIds } } });

    await app.close();
  });

  describe('Criação (POST)', () => {
    it('cria uma publication válida, sempre em DRAFT com scheduledAt null', async () => {
      const response = await request(app.getHttpServer())
        .post(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ channel: 'INSTAGRAM' })
        .expect(201);

      const body = (response.body as SuccessEnvelope<PublicationResponseBody>)
        .data;
      expect(body.status).toBe('DRAFT');
      expect(body.scheduledAt).toBeNull();
      expect(body.contentId).toBe(contentAId);
      expect(body.channel).toBe('INSTAGRAM');
    });

    it('rejeita (400) criação com scheduledAt no body — forbidNonWhitelisted (ADR-003), CreatePublicationDto não tem esse campo', async () => {
      const response = await request(app.getHttpServer())
        .post(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ channel: 'INSTAGRAM', scheduledAt: '2026-11-01T12:00:00.000Z' })
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);
    });

    it('rejeita (400) propriedade não permitida no body — forbidNonWhitelisted', async () => {
      const response = await request(app.getHttpServer())
        .post(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ channel: 'INSTAGRAM', ownerId: userAId })
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);
    });

    it('cria normalmente dentro de Campaign/Content pertencentes ao usuário autenticado', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );
      expect(publication.contentId).toBe(contentAId);
    });

    it('rejeita (404) criação em content de outro usuário', async () => {
      await request(app.getHttpServer())
        .post(
          `/v1/campaigns/${campaignBId}/contents/${contentBId}/publications`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ channel: 'INSTAGRAM' })
        .expect(404);
    });

    it('rejeita (404) inconsistência entre campaignId e contentId na criação', async () => {
      // contentAId pertence a campaignAId, não a campaignA2Id.
      await request(app.getHttpServer())
        .post(
          `/v1/campaigns/${campaignA2Id}/contents/${contentAId}/publications`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ channel: 'INSTAGRAM' })
        .expect(404);
    });
  });

  describe('Listagem (GET list)', () => {
    let listContentId: string;

    beforeAll(async () => {
      listContentId = await createContent(
        tokenA,
        campaignAId,
        'Conteúdo para listagem (Publications E2E)',
      );
      await createPublication(tokenA, campaignAId, listContentId);
      await createPublication(tokenA, campaignAId, listContentId);
    });

    it('lista as publications do content', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignAId}/contents/${listContentId}/publications`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedPublicationsBody>)
        .data;
      expect(body.items).toHaveLength(2);
      expect(body.meta.total).toBe(2);
    });

    it('pagina a listagem respeitando page/limit', async () => {
      const pagingContentId = await createContent(
        tokenA,
        campaignAId,
        'Conteúdo para paginação (Publications E2E)',
      );
      await createPublication(tokenA, campaignAId, pagingContentId);
      await createPublication(tokenA, campaignAId, pagingContentId);
      await createPublication(tokenA, campaignAId, pagingContentId);

      const response = await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignAId}/contents/${pagingContentId}/publications?page=2&limit=2`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedPublicationsBody>)
        .data;
      expect(body.items).toHaveLength(1);
      expect(body.meta).toEqual({
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('filtra por status e, sem filtro, retorna DRAFT e SCHEDULED juntos', async () => {
      const filterContentId = await createContent(
        tokenA,
        campaignAId,
        'Conteúdo para filtro de status (Publications E2E)',
      );
      const draft = await createPublication(
        tokenA,
        campaignAId,
        filterContentId,
      );
      const toSchedule = await createPublication(
        tokenA,
        campaignAId,
        filterContentId,
      );
      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${filterContentId}/publications/${toSchedule.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          status: 'SCHEDULED',
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        })
        .expect(200);

      const onlyDraft = await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignAId}/contents/${filterContentId}/publications?status=DRAFT`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const draftBody = (
        onlyDraft.body as SuccessEnvelope<PaginatedPublicationsBody>
      ).data;
      expect(draftBody.items.map((p) => p.id)).toEqual([draft.id]);

      const onlyScheduled = await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignAId}/contents/${filterContentId}/publications?status=SCHEDULED`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const scheduledBody = (
        onlyScheduled.body as SuccessEnvelope<PaginatedPublicationsBody>
      ).data;
      expect(scheduledBody.items.map((p) => p.id)).toEqual([toSchedule.id]);

      const noFilter = await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignAId}/contents/${filterContentId}/publications`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const noFilterBody = (
        noFilter.body as SuccessEnvelope<PaginatedPublicationsBody>
      ).data;
      expect(noFilterBody.items).toHaveLength(2);
      expect(noFilterBody.items.map((p) => p.status).sort()).toEqual([
        'DRAFT',
        'SCHEDULED',
      ]);
    });

    it('nega (404) acesso à listagem de um content pertencente a outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/v1/campaigns/${campaignBId}/contents/${contentBId}/publications`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('inconsistência entre campaignId e contentId resulta em 404', async () => {
      // listContentId pertence a campaignAId, não a campaignA2Id.
      await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignA2Id}/contents/${listContentId}/publications`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });
  });

  describe('Busca (GET by id)', () => {
    it('retorna a publication existente e pertencente ao usuário', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );

      const response = await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PublicationResponseBody>)
        .data;
      expect(body.id).toBe(publication.id);
    });

    it('retorna 404 para publication inexistente', async () => {
      await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/pb-inexistente`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('retorna 404 para publication de outro usuário', async () => {
      const publicationOfB = await createPublication(
        tokenB,
        campaignBId,
        contentBId,
      );

      await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignBId}/contents/${contentBId}/publications/${publicationOfB.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('retorna 404 quando o contentId da URL é diferente do contentId real da publication', async () => {
      const outroContentA = await createContent(
        tokenA,
        campaignAId,
        'Outro conteúdo de A (IDOR contentId)',
      );
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );

      await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignAId}/contents/${outroContentA}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('retorna 404 quando o campaignId da URL é inconsistente com a cadeia real', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );

      await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignA2Id}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('ADMIN acessa publication de outro usuário', async () => {
      const publicationOfB = await createPublication(
        tokenB,
        campaignBId,
        contentBId,
      );

      await request(app.getHttpServer())
        .get(
          `/v1/campaigns/${campaignBId}/contents/${contentBId}/publications/${publicationOfB.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Atualização de lifecycle (PATCH)', () => {
    it('agenda com scheduledAt futuro (DRAFT → SCHEDULED)', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );
      const scheduledAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

      const response = await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'SCHEDULED', scheduledAt })
        .expect(200);

      const body = (response.body as SuccessEnvelope<PublicationResponseBody>)
        .data;
      expect(body.status).toBe('SCHEDULED');
      expect(body.scheduledAt).toBe(scheduledAt);
    });

    it('rejeita (400) scheduledAt no passado', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );
      const scheduledAt = new Date(Date.now() - 1000 * 60).toISOString();

      const response = await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'SCHEDULED', scheduledAt })
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
    });

    it('rejeita (400) ausência de scheduledAt ao agendar', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );

      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'SCHEDULED' })
        .expect(400);
    });

    it('desagenda (SCHEDULED → DRAFT) e limpa scheduledAt', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );
      const scheduledAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'SCHEDULED', scheduledAt })
        .expect(200);

      const response = await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'DRAFT' })
        .expect(200);

      const body = (response.body as SuccessEnvelope<PublicationResponseBody>)
        .data;
      expect(body.status).toBe('DRAFT');
      expect(body.scheduledAt).toBeNull();
    });

    it('rejeita (409) agendar uma publication já SCHEDULED', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );
      const scheduledAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'SCHEDULED', scheduledAt })
        .expect(200);

      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          status: 'SCHEDULED',
          scheduledAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
        })
        .expect(409);
    });

    it('rejeita (404) tentativa de alterar publication de outro usuário', async () => {
      const publicationOfB = await createPublication(
        tokenB,
        campaignBId,
        contentBId,
      );

      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignBId}/contents/${contentBId}/publications/${publicationOfB.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          status: 'SCHEDULED',
          scheduledAt: new Date(Date.now() + 1000 * 60).toISOString(),
        })
        .expect(404);
    });

    it('rejeita (400) scheduledAt enviado junto com status=DRAFT — combinação inválida, não silenciosamente ignorada', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );
      const scheduledAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'SCHEDULED', scheduledAt })
        .expect(200);

      const response = await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'DRAFT', scheduledAt })
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);
    });

    it('rejeita (409) desagendar uma publication que já está DRAFT — transição para o mesmo estado', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );

      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'DRAFT' })
        .expect(409);
    });

    it('rejeita (404) PATCH com contentId da URL inconsistente com a publication', async () => {
      const outroContentA = await createContent(
        tokenA,
        campaignAId,
        'Outro conteúdo de A (IDOR PATCH contentId)',
      );
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );

      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignAId}/contents/${outroContentA}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'DRAFT' })
        .expect(404);
    });

    it('rejeita (404) PATCH com campaignId da URL inconsistente com a cadeia real', async () => {
      const publication = await createPublication(
        tokenA,
        campaignAId,
        contentAId,
      );

      await request(app.getHttpServer())
        .patch(
          `/v1/campaigns/${campaignA2Id}/contents/${contentAId}/publications/${publication.id}`,
        )
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'DRAFT' })
        .expect(404);
    });
  });
});
