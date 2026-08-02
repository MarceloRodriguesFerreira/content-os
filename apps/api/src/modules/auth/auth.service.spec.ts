import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AppConfigService } from '../../config/app-config.service';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { Role, User } from '../../../generated/prisma/client';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokensRepository: jest.Mocked<RefreshTokensRepository>;

  const fakeUser: User = {
    id: 'u1',
    email: 'ana@example.com',
    password: 'hashed-password',
    name: 'Ana',
    active: true,
    role: Role.USER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmail: jest.fn(), findByIdOrFail: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-jwt') },
        },
        {
          provide: AppConfigService,
          useValue: { jwtRefreshTtl: '7d' } as Partial<AppConfigService>,
        },
        {
          provide: RefreshTokensRepository,
          useValue: {
            create: jest.fn(),
            findByHash: jest.fn(),
            markRotated: jest.fn(),
            revoke: jest.fn(),
            revokeAllForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    refreshTokensRepository = module.get(RefreshTokensRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('retorna access + refresh token com credenciais válidas', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      refreshTokensRepository.create.mockResolvedValue({
        id: 'rt1',
      } as never);

      const result = await service.login({
        email: 'ana@example.com',
        password: 'S3nhaForte!23',
      });

      expect(result.accessToken).toBe('signed-jwt');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(0);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'ana@example.com',
        role: Role.USER,
      });
      expect(refreshTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1' }),
      );
    });

    it('propaga o role do usuário (não apenas USER) no payload do token', async () => {
      const adminUser: User = { ...fakeUser, id: 'u2', role: Role.ADMIN };
      usersService.findByEmail.mockResolvedValue(adminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      refreshTokensRepository.create.mockResolvedValue({
        id: 'rt2',
      } as never);

      await service.login({
        email: 'ana@example.com',
        password: 'S3nhaForte!23',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.ADMIN }),
      );
    });

    it('lança UnauthorizedException quando o e-mail não existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando o usuário está inativo', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...fakeUser,
        active: false,
      });

      await expect(
        service.login({ email: 'ana@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando a senha está incorreta', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'ana@example.com', password: 'errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotaciona o token e retorna um novo par quando o refresh é válido', async () => {
      const storedToken = {
        id: 'rt-old',
        userId: 'u1',
        tokenHash: 'hash-antigo',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
      };

      refreshTokensRepository.findByHash.mockResolvedValue(
        storedToken as never,
      );
      usersService.findByIdOrFail.mockResolvedValue(fakeUser);
      refreshTokensRepository.create.mockResolvedValue({
        id: 'rt-new',
      } as never);

      const result = await service.refresh('token-em-texto-puro');

      expect(refreshTokensRepository.markRotated).toHaveBeenCalledWith(
        'rt-old',
        'rt-new',
      );
      expect(result.accessToken).toBe('signed-jwt');
    });

    it('lança UnauthorizedException quando o token não existe', async () => {
      refreshTokensRepository.findByHash.mockResolvedValue(null);

      await expect(service.refresh('token-invalido')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando o token está expirado', async () => {
      refreshTokensRepository.findByHash.mockResolvedValue({
        id: 'rt-old',
        userId: 'u1',
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
      } as never);

      await expect(service.refresh('token-expirado')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('detecta reuso (token já revogado) e revoga toda a família do usuário', async () => {
      refreshTokensRepository.findByHash.mockResolvedValue({
        id: 'rt-old',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: new Date(),
      } as never);

      await expect(service.refresh('token-ja-usado')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(refreshTokensRepository.revokeAllForUser).toHaveBeenCalledWith(
        'u1',
      );
    });
  });

  describe('logout', () => {
    it('revoga o token quando pertence ao usuário autenticado', async () => {
      refreshTokensRepository.findByHash.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
      } as never);

      await service.logout('token-valido', 'u1');

      expect(refreshTokensRepository.revoke).toHaveBeenCalledWith('rt1');
    });

    it('não revoga (silenciosamente) quando o token pertence a outro usuário', async () => {
      refreshTokensRepository.findByHash.mockResolvedValue({
        id: 'rt1',
        userId: 'outro-usuario',
      } as never);

      await service.logout('token-de-outro-usuario', 'u1');

      expect(refreshTokensRepository.revoke).not.toHaveBeenCalled();
    });

    it('não lança erro quando o token não existe (idempotente)', async () => {
      refreshTokensRepository.findByHash.mockResolvedValue(null);

      await expect(
        service.logout('token-inexistente', 'u1'),
      ).resolves.toBeUndefined();
    });
  });
});
