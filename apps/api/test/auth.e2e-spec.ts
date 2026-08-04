import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/modules/users/users.service';

interface AuthResponseBody {
  accessToken: string;
  refreshToken: string;
}

interface UserResponseBody {
  email: string;
  role: string;
}

/** Formato padrão de resposta de sucesso desde o Bloco B (ADR-007). */
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
    // ValidationPipe, AllExceptionsFilter e TransformInterceptor vêm do
    // próprio AppModule (APP_PIPE/APP_FILTER/APP_INTERCEPTOR, Bloco B da
    // SPR-008 / ADR-007/ADR-003) — nenhuma configuração extra necessária
    // aqui. Versionamento (Bloco C / ADR-005) já não tem esse privilégio —
    // não é provider, precisa de configureApp() explícito aqui também,
    // igual a main.ts, para nunca divergir de produção.
    configureApp(app);
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
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: 'senha-errada' })
      .expect(401);

    // Envelope de erro (ADR-007): status HTTP não muda, só o formato do corpo.
    const body = response.body as ErrorEnvelope;
    expect(body.success).toBe(false);
    expect(body.error.statusCode).toBe(401);
  });

  it('bloqueia rota protegida sem token', async () => {
    await request(app.getHttpServer()).get('/v1/users/me').expect(401);
  });

  it('login → acessa rota protegida → refresh (rotação) → logout', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const { accessToken, refreshToken } = (
      loginResponse.body as SuccessEnvelope<AuthResponseBody>
    ).data;
    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));

    const meResponse = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const meBody = (meResponse.body as SuccessEnvelope<UserResponseBody>).data;
    expect(meBody.email).toBe(testUser.email);
    expect(meBody).not.toHaveProperty('password');

    const refreshResponse = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    const newTokens = (
      refreshResponse.body as SuccessEnvelope<AuthResponseBody>
    ).data;
    expect(newTokens.refreshToken).not.toBe(refreshToken);

    // Reuso do refresh token antigo (já rotacionado) deve ser rejeitado
    // e revogar toda a família de tokens do usuário.
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    // Por causa da revogação em massa acima, até o token NOVO (que seria
    // válido) também deve ter sido revogado.
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: newTokens.refreshToken })
      .expect(401);
  });

  it('logout revoga o refresh token (uso subsequente falha)', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const { accessToken, refreshToken } = (
      loginResponse.body as SuccessEnvelope<AuthResponseBody>
    ).data;

    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
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
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const { accessToken } = (
      loginResponse.body as SuccessEnvelope<AuthResponseBody>
    ).data;
    const payload = decodeJwtPayload(accessToken);

    // Usuário de teste é criado via UsersService.create(), que não recebe
    // role explicitamente — deve assumir USER por padrão (schema.prisma).
    expect(payload.role).toBe('USER');
    expect(payload.email).toBe(testUser.email);
  });

  it('GET /v1/users/me expõe o role do usuário autenticado', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const { accessToken } = (
      loginResponse.body as SuccessEnvelope<AuthResponseBody>
    ).data;

    const meResponse = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const meBody = (meResponse.body as SuccessEnvelope<UserResponseBody>).data;
    expect(meBody.role).toBe('USER');
  });

  /**
   * HTTP Pipeline (Bloco B / ADR-007): valida o envelope de erro produzido
   * pelo ValidationPipe global quando um campo desconhecido é enviado
   * (forbidNonWhitelisted) — cobre a integração ValidationPipe →
   * AllExceptionsFilter de ponta a ponta.
   */
  it('rejeita campo desconhecido no login (ValidationPipe + envelope de erro)', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        isAdmin: true, // campo não declarado no LoginDto
      })
      .expect(400);

    const body = response.body as ErrorEnvelope;
    expect(body.success).toBe(false);
    expect(body.error.statusCode).toBe(400);
    expect(body.error.message).toEqual(
      expect.arrayContaining([expect.stringContaining('isAdmin')]),
    );
    expect(body.path).toBe('/v1/auth/login');
    expect(body.timestamp).toEqual(expect.any(String));
  });
});
