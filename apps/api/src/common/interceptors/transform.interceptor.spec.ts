import { CallHandler, ExecutionContext, HttpStatus } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  function callWith(
    payload: unknown,
    statusCode = HttpStatus.OK,
  ): Promise<unknown> {
    const context = {
      switchToHttp: () => ({
        getResponse: () => ({ statusCode }),
      }),
    } as unknown as ExecutionContext;
    const handler: CallHandler = { handle: () => of(payload) };

    return new Promise<unknown>((resolve) => {
      interceptor.intercept(context, handler).subscribe((result) => {
        resolve(result);
      });
    });
  }

  it('envelopa o payload original em { success, data, timestamp }', async () => {
    const result = (await callWith({
      id: 'u1',
      email: 'ana@example.com',
    })) as { success: boolean; data: unknown; timestamp: string };

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 'u1', email: 'ana@example.com' });
    expect(result.timestamp).toEqual(expect.any(String));
  });

  it('não altera o conteúdo de data — mesmo payload que o handler retornou', async () => {
    const payload = { accessToken: 'abc', refreshToken: 'def' };
    const result = (await callWith(payload)) as { data: unknown };

    expect(result.data).toEqual(payload);
  });

  it('funciona também para payloads primitivos/vazios (ex.: 200 sem corpo relevante)', async () => {
    const result = (await callWith(undefined)) as {
      success: boolean;
      data: unknown;
      timestamp: string;
    };

    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
    expect(result.timestamp).toEqual(expect.any(String));
  });

  it('NÃO envelopa respostas 204 No Content (ex.: POST /auth/logout)', async () => {
    const result = await callWith(undefined, HttpStatus.NO_CONTENT);

    expect(result).toBeUndefined();
  });
});
