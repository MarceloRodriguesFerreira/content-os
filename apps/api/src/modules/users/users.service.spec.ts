import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { Prisma, Role, User } from '../../../generated/prisma/client';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const fakeUser: User = {
    id: 'u1',
    email: 'ana@example.com',
    password: 'hashed',
    name: 'Ana',
    active: true,
    role: Role.USER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria o usuário com senha hasheada (bcrypt, fator 10) quando o e-mail não existe', async () => {
      repository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      repository.create.mockResolvedValue(fakeUser);

      const result = await service.create({
        email: 'ana@example.com',
        password: 'S3nhaForte!23',
        name: 'Ana',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('S3nhaForte!23', 10);
      expect(repository.create).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'hashed-password',
        name: 'Ana',
      });
      expect(result).toEqual(fakeUser);
    });

    it('lança ConflictException quando o e-mail já existe', async () => {
      repository.findByEmail.mockResolvedValue(fakeUser);

      await expect(
        service.create({
          email: 'ana@example.com',
          password: 'x',
          name: 'Ana',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('normaliza o e-mail (trim + lowercase) antes de consultar e persistir', async () => {
      repository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      repository.create.mockResolvedValue(fakeUser);

      await service.create({
        email: '  Ana@Example.com  ',
        password: 'S3nhaForte!23',
        name: 'Ana',
      });

      expect(repository.findByEmail).toHaveBeenCalledWith('ana@example.com');
      expect(repository.create).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'hashed-password',
        name: 'Ana',
      });
    });

    it('lança ConflictException quando o repository rejeita com P2002 (condição de corrida)', async () => {
      repository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        { code: 'P2002', clientVersion: 'test' },
      );
      repository.create.mockRejectedValue(p2002Error);

      await expect(
        service.create({
          email: 'ana@example.com',
          password: 'S3nhaForte!23',
          name: 'Ana',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('propaga outros erros do repository sem modificação (não é P2002)', async () => {
      repository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const unexpectedError = new Error('conexão com o banco perdida');
      repository.create.mockRejectedValue(unexpectedError);

      await expect(
        service.create({
          email: 'ana@example.com',
          password: 'S3nhaForte!23',
          name: 'Ana',
        }),
      ).rejects.toThrow(unexpectedError);
    });

    it('continua aceitando um objeto literal simples { email, password, name } — regressão de contrato', async () => {
      // Nenhum consumidor existente (auth.e2e-spec.ts, projects.e2e-spec.ts)
      // instancia CreateUserDto/CreateUserInput — todos passam objetos
      // literais, aceitos por tipagem estrutural. Este teste comprova que a
      // troca de CreateUserDto para CreateUserInput (SPR-011, Bloco A) não
      // quebra esse padrão.
      repository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      repository.create.mockResolvedValue(fakeUser);

      const plainObject = {
        email: 'ana@example.com',
        password: 'S3nhaForte!23',
        name: 'Ana',
      };

      await expect(service.create(plainObject)).resolves.toEqual(fakeUser);
    });
  });

  describe('findByIdOrFail', () => {
    it('retorna o usuário quando encontrado', async () => {
      repository.findById.mockResolvedValue(fakeUser);
      await expect(service.findByIdOrFail('u1')).resolves.toEqual(fakeUser);
    });

    it('lança NotFoundException quando não encontrado', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findByIdOrFail('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toResponseDto', () => {
    it('nunca inclui o campo password', () => {
      const dto = service.toResponseDto(fakeUser);

      expect(dto).not.toHaveProperty('password');
      expect(dto).toEqual({
        id: 'u1',
        email: 'ana@example.com',
        name: 'Ana',
        active: true,
        role: Role.USER,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });
});
