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

interface PaginatedProjectsBody {
  items: ProjectResponseBody[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Cobre o Plano de Testes E2E do design doc da SPR-009: fluxo completo,
 * isolamento entre usuários (`ADR-009`), acesso administrativo, paginação,
 * validação de entrada e conflito de estado.
 *
 * Requer um Postgres real com as migrations aplicadas e o Prisma Client
 * regenerado — mesmo pré-requisito de `auth.e2e-spec.ts`.
 */
describe('Projects (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let usersService: UsersService;

  const suffix = Date.now();
  const userA = {
    email: `projects-e2e-a-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuária A',
  };
  const userB = {
    email: `projects-e2e-b-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuário B',
  };
  const adminUser = {
    email: `projects-e2e-admin-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Admin',
  };
  const paginationUser = {
    email: `projects-e2e-pagination-${suffix}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuária Paginação',
  };

  let userAId: string;
  let userBId: string;
  let adminUserId: string;
  let paginationUserId: string;

  let tokenA: string;
  let tokenB: string;
  let adminToken: string;
  let paginationToken: string;

  async function login(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(200);

    return (response.body as SuccessEnvelope<AuthResponseBody>).data
      .accessToken;
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
    const createdPagination = await usersService.create(paginationUser);

    userAId = createdA.id;
    userBId = createdB.id;
    adminUserId = createdAdmin.id;
    paginationUserId = createdPagination.id;

    // Não há endpoint HTTP para promover papel (fora de escopo da
    // SPR-009 — RBAC administrativo é gerenciamento de usuários, não
    // deste domínio) — ajuste direto via Prisma, só para o setup do
    // teste, mesmo padrão de "sem endpoint de registro público" já usado
    // em auth.e2e-spec.ts.
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: Role.ADMIN },
    });

    tokenA = await login(userA.email, userA.password);
    tokenB = await login(userB.email, userB.password);
    adminToken = await login(adminUser.email, adminUser.password);
    paginationToken = await login(
      paginationUser.email,
      paginationUser.password,
    );
  });

  afterAll(async () => {
    const ownerIds = [userAId, userBId, adminUserId, paginationUserId];

    // `ownerId` é `ON DELETE RESTRICT` (Bloco A) — precisa apagar os
    // projetos antes dos usuários donos, ou a FK rejeita o DELETE.
    await prisma.project.deleteMany({ where: { ownerId: { in: ownerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ownerIds } } });
    await app.close();
  });

  describe('Fluxo completo', () => {
    let projectId: string;

    it('POST /v1/projects cria o projeto com o ownerId do usuário autenticado', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Projeto Fluxo Completo', description: 'desc inicial' })
        .expect(201);

      const body = (response.body as SuccessEnvelope<ProjectResponseBody>).data;
      expect(body.name).toBe('Projeto Fluxo Completo');
      expect(body.status).toBe('ACTIVE');
      expect(body.ownerId).toBe(userAId);
      projectId = body.id;
    });

    it('GET /v1/projects lista o projeto recém-criado (filtro ACTIVE por padrão)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedProjectsBody>)
        .data;
      expect(body.items.map((p) => p.id)).toContain(projectId);
    });

    it('GET /v1/projects/:id retorna o detalhe do projeto', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<ProjectResponseBody>).data;
      expect(body.id).toBe(projectId);
    });

    it('PATCH /v1/projects/:id atualiza o nome', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      const body = (response.body as SuccessEnvelope<ProjectResponseBody>).data;
      expect(body.name).toBe('Nome Atualizado');
    });

    it('POST /v1/projects/:id/archive arquiva o projeto', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<ProjectResponseBody>).data;
      expect(body.status).toBe('ARCHIVED');
    });

    it('GET /v1/projects (default) não inclui mais o projeto arquivado', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedProjectsBody>)
        .data;
      expect(body.items.map((p) => p.id)).not.toContain(projectId);
    });

    it('GET /v1/projects?status=ARCHIVED inclui o projeto arquivado', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/projects?status=ARCHIVED')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedProjectsBody>)
        .data;
      expect(body.items.map((p) => p.id)).toContain(projectId);
    });

    it('GET /v1/projects?status=ALL inclui o projeto independente do status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/projects?status=ALL')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedProjectsBody>)
        .data;
      expect(body.items.map((p) => p.id)).toContain(projectId);
    });

    it('POST /v1/projects/:id/restore restaura o projeto', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/projects/${projectId}/restore`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<ProjectResponseBody>).data;
      expect(body.status).toBe('ACTIVE');
    });

    it('GET /v1/projects (default) volta a incluir o projeto restaurado', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedProjectsBody>)
        .data;
      expect(body.items.map((p) => p.id)).toContain(projectId);
    });
  });

  describe('Isolamento entre usuários (ADR-009)', () => {
    let projectOfUserAId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Projeto Privado de A' })
        .expect(201);

      projectOfUserAId = (response.body as SuccessEnvelope<ProjectResponseBody>)
        .data.id;
    });

    it('usuário B não consegue ler o projeto de A (403)', async () => {
      await request(app.getHttpServer())
        .get(`/v1/projects/${projectOfUserAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('usuário B não consegue editar o projeto de A (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/projects/${projectOfUserAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Tentativa de invasão' })
        .expect(403);
    });

    it('usuário B não consegue arquivar o projeto de A (403)', async () => {
      await request(app.getHttpServer())
        .post(`/v1/projects/${projectOfUserAId}/archive`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('usuário B não consegue restaurar o projeto de A (403)', async () => {
      await request(app.getHttpServer())
        .post(`/v1/projects/${projectOfUserAId}/restore`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('usuário B não vê o projeto de A na própria listagem', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/projects?status=ALL')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedProjectsBody>)
        .data;
      expect(body.items.map((p) => p.id)).not.toContain(projectOfUserAId);
    });

    it('projeto inexistente retorna 404 (não 403) mesmo para o dono', async () => {
      await request(app.getHttpServer())
        .get('/v1/projects/id-que-nao-existe')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });
  });

  describe('Acesso administrativo (ADR-009)', () => {
    it('ADMIN acessa o projeto de outro usuário normalmente', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Projeto Visível ao Admin' })
        .expect(201);

      const projectId = (
        createResponse.body as SuccessEnvelope<ProjectResponseBody>
      ).data.id;

      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<ProjectResponseBody>).data;
      expect(body.id).toBe(projectId);
      expect(body.ownerId).toBe(userAId);
    });
  });

  describe('Paginação', () => {
    beforeAll(async () => {
      for (let i = 0; i < 5; i += 1) {
        await request(app.getHttpServer())
          .post('/v1/projects')
          .set('Authorization', `Bearer ${paginationToken}`)
          .send({ name: `Projeto Paginado ${i}` })
          .expect(201);
      }
    });

    it('respeita `limit` e calcula `meta.total`/`meta.totalPages` corretamente', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/projects?page=1&limit=2')
        .set('Authorization', `Bearer ${paginationToken}`)
        .expect(200);

      const body = (response.body as SuccessEnvelope<PaginatedProjectsBody>)
        .data;
      expect(body.items).toHaveLength(2);
      expect(body.meta).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it('a segunda página retorna os itens seguintes, sem repetir', async () => {
      const firstPage = await request(app.getHttpServer())
        .get('/v1/projects?page=1&limit=2')
        .set('Authorization', `Bearer ${paginationToken}`)
        .expect(200);

      const secondPage = await request(app.getHttpServer())
        .get('/v1/projects?page=2&limit=2')
        .set('Authorization', `Bearer ${paginationToken}`)
        .expect(200);

      const firstIds = (
        firstPage.body as SuccessEnvelope<PaginatedProjectsBody>
      ).data.items.map((p) => p.id);
      const secondIds = (
        secondPage.body as SuccessEnvelope<PaginatedProjectsBody>
      ).data.items.map((p) => p.id);

      expect(secondIds).toHaveLength(2);
      expect(firstIds.some((id) => secondIds.includes(id))).toBe(false);
    });
  });

  describe('Validação de entrada', () => {
    it('POST /v1/projects sem name retorna 400 (envelope de erro, ADR-007)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/projects')
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

    it('PATCH /v1/projects/:id sem nenhum campo retorna 400 (regra de negócio do Service)', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Projeto Para Validar PATCH Vazio' })
        .expect(201);

      const projectId = (
        createResponse.body as SuccessEnvelope<ProjectResponseBody>
      ).data.id;

      const response = await request(app.getHttpServer())
        .patch(`/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({})
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(400);
    });

    it('POST /v1/projects sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/v1/projects')
        .send({ name: 'Sem autenticação' })
        .expect(401);
    });
  });

  describe('Conflito de estado', () => {
    it('archive em projeto já ARCHIVED retorna 409', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Projeto Para Testar Conflito' })
        .expect(201);

      const projectId = (
        createResponse.body as SuccessEnvelope<ProjectResponseBody>
      ).data.id;

      await request(app.getHttpServer())
        .post(`/v1/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .post(`/v1/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(409);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(409);
    });

    it('restore em projeto já ACTIVE retorna 409', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Projeto Ativo Para Testar Restore' })
        .expect(201);

      const projectId = (
        createResponse.body as SuccessEnvelope<ProjectResponseBody>
      ).data.id;

      await request(app.getHttpServer())
        .post(`/v1/projects/${projectId}/restore`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(409);
    });
  });
});
