import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { Role, User } from '../../../generated/prisma/client';

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
