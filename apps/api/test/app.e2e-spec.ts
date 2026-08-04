import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';

/** Formatos padrão de resposta desde o Bloco B (ADR-007). */
interface SuccessEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

describe('Platform (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Versionamento (Bloco C / ADR-005) precisa ser habilitado explicitamente
    // aqui também — não é um provider, não vem automaticamente do AppModule
    // como ValidationPipe/AllExceptionsFilter/TransformInterceptor (Bloco B).
    // `configureApp()` é a mesma função usada em produção (main.ts), para
    // que produção e testes E2E nunca divirjam nesse ponto.
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / não existe mais (removida — ADR-005, artefato do scaffold do NestJS)', async () => {
    await request(app.getHttpServer()).get('/').expect(404);
  });

  it('/health (GET) — pública, envelopada (Bloco B / ADR-007), fora do versionamento (ADR-005)', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = response.body as SuccessEnvelope<{ status: string }>;

    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.timestamp).toEqual(expect.any(String));
  });

  it('/v1/health não existe — health é VERSION_NEUTRAL, não vive sob /v1 (ADR-005)', async () => {
    await request(app.getHttpServer()).get('/v1/health').expect(404);
  });
});
