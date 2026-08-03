import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorEnvelope {
  success: false;
  error: {
    statusCode: number;
    error: string;
    message: string | string[];
  };
  path: string;
  timestamp: string;
}

/**
 * Filtro global de exceções (Bloco B da SPR-008 / ADR-007). Padroniza toda
 * resposta de erro da API — HTTP status não muda, só o formato do corpo.
 *
 * Exceções não previstas (que não são `HttpException`) nunca vazam detalhes
 * internos (stack trace, mensagem da causa raiz) para o cliente — apenas
 * uma mensagem genérica de 500. O erro real é registrado no log do
 * servidor, para investigação.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message } = this.resolveError(exception);

    if (statusCode >= (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const envelope: ErrorEnvelope = {
      success: false,
      error: { statusCode, error, message },
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(envelope);
  }

  private resolveError(exception: unknown): {
    statusCode: number;
    error: string;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();

      // Nest às vezes retorna a resposta da exceção como string simples
      // (ex.: new UnauthorizedException('Credenciais inválidas.')) e às
      // vezes como objeto (ex.: erros do ValidationPipe, que incluem
      // `message` como array e `error` com o nome da classe HTTP).
      if (typeof body === 'string') {
        return {
          statusCode,
          error: exception.name,
          message: body,
        };
      }

      const bodyObject = body as {
        error?: string;
        message?: string | string[];
      };

      return {
        statusCode,
        error: bodyObject.error ?? exception.name,
        message: bodyObject.message ?? exception.message,
      };
    }

    // Exceção não prevista: nunca expor detalhes internos ao cliente.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor.',
    };
  }
}
