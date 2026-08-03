import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/** Formatos padrão de resposta desde o Bloco B (ADR-007). */
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

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) — protegida pelo guard global desde a SPR-007 (não está na lista de rotas públicas)', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(401);
    const body = response.body as ErrorEnvelope;

    // Envelope de erro global (Bloco B / ADR-007).
    expect(body.success).toBe(false);
    expect(body.error.statusCode).toBe(401);
    expect(body.path).toBe('/');
    expect(body.timestamp).toEqual(expect.any(String));
  });

  it('/health (GET) — pública, segue funcionando sem token, envelopada (Bloco B / ADR-007)', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = response.body as SuccessEnvelope<{ status: string }>;

    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.timestamp).toEqual(expect.any(String));
  });

  afterEach(async () => {
    await app.close();
  });
});
