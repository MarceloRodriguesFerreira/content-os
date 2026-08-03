import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ method: 'POST', url: '/auth/login' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('envelopa uma HttpException com mensagem string (ex.: UnauthorizedException)', () => {
    filter.catch(new UnauthorizedException('Credenciais inválidas.'), host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: 'Credenciais inválidas.',
        },
        path: '/auth/login',
      }),
    );
  });

  it('envelopa uma HttpException com corpo objeto (ex.: ValidationPipe/BadRequestException)', () => {
    filter.catch(
      new BadRequestException({
        message: ['email must be an email'],
        error: 'Bad Request',
        statusCode: 400,
      }),
      host,
    );

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: ['email must be an email'],
        },
      }),
    );
  });

  it('mantém o statusCode correto para outras HttpException (ex.: ForbiddenException)', () => {
    filter.catch(new ForbiddenException(), host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
  });

  it('responde 500 genérico, sem vazar detalhes, para exceção não prevista', () => {
    filter.catch(new Error('detalhe interno sensível'), host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const [envelope] = jsonMock.mock.calls[0] as [Record<string, unknown>];
    const error = envelope.error as { message: string };
    expect(error.message).toBe('Erro interno do servidor.');
    expect(JSON.stringify(envelope)).not.toContain('detalhe interno sensível');
  });

  it('inclui path e timestamp em todo envelope de erro', () => {
    filter.catch(new UnauthorizedException(), host);

    const [envelope] = jsonMock.mock.calls[0] as [Record<string, unknown>];
    expect(envelope.path).toBe('/auth/login');
    expect(envelope.timestamp).toEqual(expect.any(String));
  });
});
