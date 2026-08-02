import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/modules/users/users.service';

interface AuthResponseBody {
  accessToken: string;
  refreshToken: string;
}

interface UserResponseBody {
  email: string;
}

/** Decodifica (sem verificar assinatura) o payload de um JWT — suficiente
 * para inspecionar claims em teste, já que a assinatura já foi validada
 * implicitamente pelo próprio backend ao aceitar o login. */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payloadSegment] = token.split('.');
  const json = Buffer.from(payloadSegment, 'base64url').toString('utf-8');
  return JSON.parse(json) as Record<string, unknown>;
}

/**
 * Cobre o fluxo completo descrito na SPR-006 (seções 8.1–8.4):
 * login → acesso a rota protegida → refresh (rotação) → reuso detectado
 * (revogação em massa) → logout.
 *
 * Requer um Postgres real (mesmo padrão dos demais testes e2e do projeto)
 * com as migrations aplicadas (`pnpm db:migrate`) e o Prisma Client
 * regenerado (`pnpm db:generate`).
 */
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const testUser = {
    email: `auth-e2e-${Date.now()}@example.com`,
    password: 'S3nhaForte!23',
    name: 'Usuário de Teste E2E',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // ValidationPipe global normalmente é responsabilidade de outra sprint
    // (ver pendência registrada na SPR-006/SPR-007); aplicado aqui só no
    // escopo do teste, para exercitar os DTOs com validação de verdade.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Cria o usuário de teste diretamente via UsersService (não há
    // endpoint público de registro documentado — ver observação na
    // entrega da SPR-007).
    const usersService = moduleFixture.get(UsersService);
    await usersService.create(testUser);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  it('rejeita login com senha incorreta', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'senha-errada' })
      .expect(401);
  });

  it('bloqueia rota protegida sem token', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('login → acessa rota protegida → refresh (rotação) → logout', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const { accessToken, refreshToken } =
      loginResponse.body as AuthResponseBody;
    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));

    const meResponse = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const meBody = meResponse.body as UserResponseBody;
    expect(meBody.email).toBe(testUser.email);
    expect(meBody).not.toHaveProperty('password');

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    const newTokens = refreshResponse.body as AuthResponseBody;
    expect(newTokens.refreshToken).not.toBe(refreshToken);

    // Reuso do refresh token antigo (já rotacionado) deve ser rejeitado
    // e revogar toda a família de tokens do usuário.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    // Por causa da revogação em massa acima, até o token NOVO (que seria
    // válido) também deve ter sido revogado.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: newTokens.refreshToken })
      .expect(401);
  });

  it('logout revoga o refresh token (uso subsequente falha)', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const { accessToken, refreshToken } =
      loginResponse.body as AuthResponseBody;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  /**
   * RBAC (SPR-008, Bloco A / ADR-004): valida que o token emitido carrega o
   * claim `role` e que ele reflete o papel do usuário no banco — sem
   * depender de uma rota protegida por `@Roles()`, já que nenhuma rota de
   * negócio nova usa RBAC nesta sprint (ver `SPR-008-bloco-a-rbac.md`).
   */
  it('token emitido no login carrega o claim role do usuário (RBAC)', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const { accessToken } = loginResponse.body as AuthResponseBody;
    const payload = decodeJwtPayload(accessToken);

    // Usuário de teste é criado via UsersService.create(), que não recebe
    // role explicitamente — deve assumir USER por padrão (schema.prisma).
    expect(payload.role).toBe('USER');
    expect(payload.email).toBe(testUser.email);
  });

  it('GET /users/me expõe o role do usuário autenticado', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const { accessToken } = loginResponse.body as AuthResponseBody;

    const meResponse = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const meBody = meResponse.body as UserResponseBody & { role: string };
    expect(meBody.role).toBe('USER');
  });
});
