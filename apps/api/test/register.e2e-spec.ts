import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

interface AuthResponseBody {
  accessToken: string;
  refreshToken: string;
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

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payloadSegment] = token.split('.');
  const json = Buffer.from(payloadSegment, 'base64url').toString('utf-8');
  return JSON.parse(json) as Record<string, unknown>;
}

/**
 * Cobre o fluxo de registro público definido no Design Freeze da SPR-011:
 * registro válido, e-mail duplicado (prévio e sob concorrência real via
 * P2002), payload inválido, tentativa de definir `role`, e o fluxo completo
 * HTTP → AuthService → UsersService → UNIQUE/P2002.
 *
 * Requer um Postgres real (mesmo padrão dos demais testes e2e do projeto)
 * com as migrations aplicadas e o Prisma Client regenerado.
 */
describe('Register (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const registeredEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (registeredEmails.length > 0) {
      await prisma.user.deleteMany({
        where: { email: { in: registeredEmails } },
      });
    }
    await app.close();
  });

  it('registra um usuário com sucesso e retorna access + refresh token', async () => {
    const email = `register-e2e-valido-${suffix}@example.com`;
    registeredEmails.push(email);

    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ name: 'Ana Souza', email, password: 'S3nhaForte!23' })
      .expect(201);

    const body = (response.body as SuccessEnvelope<AuthResponseBody>).data;
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.refreshToken).toEqual(expect.any(String));

    const payload = decodeJwtPayload(body.accessToken);
    expect(payload.email).toBe(email);
    expect(payload.role).toBe('USER');

    const createdUser = await prisma.user.findUnique({ where: { email } });
    expect(createdUser).not.toBeNull();
    expect(createdUser?.name).toBe('Ana Souza');
  });

  it('e-mail já cadastrado retorna 409 (não 500)', async () => {
    const email = `register-e2e-duplicado-${suffix}@example.com`;
    registeredEmails.push(email);

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ name: 'Ana Souza', email, password: 'S3nhaForte!23' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ name: 'Ana Souza', email, password: 'S3nhaForte!23' })
      .expect(409);

    const body = response.body as ErrorEnvelope;
    expect(body.success).toBe(false);
    expect(body.error.statusCode).toBe(409);
  });

  describe('payload inválido (400, via ValidationPipe global)', () => {
    it('e-mail com formato inválido', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          name: 'Ana Souza',
          email: 'nao-e-um-email',
          password: 'S3nhaForte!23',
        })
        .expect(400);
    });

    it('senha menor que 8 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          name: 'Ana Souza',
          email: `register-e2e-senha-curta-${suffix}@example.com`,
          password: '1234567',
        })
        .expect(400);
    });

    it('name ausente', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: `register-e2e-sem-nome-${suffix}@example.com`,
          password: 'S3nhaForte!23',
        })
        .expect(400);
    });

    it('name vazio', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          name: '',
          email: `register-e2e-nome-vazio-${suffix}@example.com`,
          password: 'S3nhaForte!23',
        })
        .expect(400);
    });
  });

  it('rejeita tentativa de definir role (400, ValidationPipe forbidNonWhitelisted)', async () => {
    const email = `register-e2e-role-${suffix}@example.com`;

    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        name: 'Ana Souza',
        email,
        password: 'S3nhaForte!23',
        role: 'ADMIN',
      })
      .expect(400);

    const body = response.body as ErrorEnvelope;
    expect(body.success).toBe(false);
    expect(body.error.statusCode).toBe(400);
    expect(body.error.message).toEqual(
      expect.arrayContaining([expect.stringContaining('role')]),
    );

    // Confirma que nada foi criado — a rejeição ocorreu antes de chegar
    // à camada de persistência.
    const createdUser = await prisma.user.findUnique({ where: { email } });
    expect(createdUser).toBeNull();
  });

  it('duas requisições HTTP concorrentes com o mesmo e-mail: exatamente uma 201, exatamente uma 409, nenhuma 500', async () => {
    const email = `register-e2e-concorrencia-${suffix}@example.com`;
    registeredEmails.push(email);

    const payload = {
      name: 'Ana Souza',
      email,
      password: 'S3nhaForte!23',
    };

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post('/v1/auth/register').send(payload),
      request(app.getHttpServer()).post('/v1/auth/register').send(payload),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const successResponse = first.status === 201 ? first : second;
    const successBody = (
      successResponse.body as SuccessEnvelope<AuthResponseBody>
    ).data;
    expect(successBody.accessToken).toEqual(expect.any(String));

    const conflictResponse = first.status === 409 ? first : second;
    const conflictBody = conflictResponse.body as ErrorEnvelope;
    expect(conflictBody.error.statusCode).toBe(409);

    const usersWithEmail = await prisma.user.count({ where: { email } });
    expect(usersWithEmail).toBe(1);
  });
});
