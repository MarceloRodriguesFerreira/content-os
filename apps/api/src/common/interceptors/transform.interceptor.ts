import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from 'express';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Interceptor global (Bloco B da SPR-008 / ADR-007). Envelopa toda resposta
 * de sucesso — `data` é exatamente o payload que o Controller já retornava,
 * sem nenhuma alteração de conteúdo.
 *
 * Exceção deliberada: respostas `204 No Content` (ex.: `POST /auth/logout`)
 * nunca são envelopadas — por definição HTTP, uma resposta 204 não tem
 * corpo, e enviar um envelope ali violaria essa semântica.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessEnvelope<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessEnvelope<T> | T> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (response.statusCode === (HttpStatus.NO_CONTENT as number)) {
          return data;
        }

        return {
          success: true as const,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
