import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../../../generated/prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('login delega para AuthService.login com o DTO recebido', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    const result = await controller.login({
      email: 'ana@example.com',
      password: 'S3nhaForte!23',
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'S3nhaForte!23',
    });
    expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });

  it('refresh delega para AuthService.refresh com o token recebido', async () => {
    authService.refresh.mockResolvedValue({
      accessToken: 'novo-access',
      refreshToken: 'novo-refresh',
    });

    const result = await controller.refresh({ refreshToken: 'token-antigo' });

    expect(authService.refresh).toHaveBeenCalledWith('token-antigo');
    expect(result.accessToken).toBe('novo-access');
  });

  it('logout delega para AuthService.logout com o token e o sub do usuário autenticado', async () => {
    await controller.logout(
      { refreshToken: 'token-valido' },
      {
        sub: 'u1',
        email: 'ana@example.com',
        role: Role.USER,
      },
    );

    expect(authService.logout).toHaveBeenCalledWith('token-valido', 'u1');
  });
});
