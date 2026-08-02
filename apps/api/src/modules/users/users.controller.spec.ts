import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role, User } from '../../../generated/prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const fakeUser: User = {
    id: 'u1',
    email: 'ana@example.com',
    password: 'hashed',
    name: 'Ana',
    active: true,
    role: Role.ADMIN,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findByIdOrFail: jest.fn(),
            toResponseDto: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('getMe busca o usuário pelo sub do token e retorna o DTO (com role)', async () => {
    usersService.findByIdOrFail.mockResolvedValue(fakeUser);
    usersService.toResponseDto.mockReturnValue({
      id: 'u1',
      email: 'ana@example.com',
      name: 'Ana',
      active: true,
      role: Role.ADMIN,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await controller.getMe({
      sub: 'u1',
      email: 'ana@example.com',
      role: Role.ADMIN,
    });

    expect(usersService.findByIdOrFail).toHaveBeenCalledWith('u1');
    expect(usersService.toResponseDto).toHaveBeenCalledWith(fakeUser);
    expect(result.role).toBe(Role.ADMIN);
    expect(result).not.toHaveProperty('password');
  });
});
