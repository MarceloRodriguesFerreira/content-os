import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectOwnershipGuard } from './project-ownership.guard';
import { ProjectsRepository } from '../repositories/projects.repository';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import {
  Project,
  ProjectStatus,
  Role,
} from '../../../../generated/prisma/client';

describe('ProjectOwnershipGuard', () => {
  let guard: ProjectOwnershipGuard;
  let repository: jest.Mocked<ProjectsRepository>;

  const fakeProject: Project = {
    id: 'p1',
    name: 'Projeto X',
    description: null,
    status: ProjectStatus.ACTIVE,
    ownerId: 'owner-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  function createContext(user: JwtPayload, projectId = 'p1'): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { id: projectId } }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ProjectsRepository>;

    guard = new ProjectOwnershipGuard(repository);
  });

  afterEach(() => jest.clearAllMocks());

  it('permite acesso quando o usuário é o dono do projeto', async () => {
    repository.findById.mockResolvedValue(fakeProject);
    const context = createContext({
      sub: 'owner-1',
      email: 'ana@example.com',
      role: Role.USER,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(repository.findById).toHaveBeenCalledWith('p1');
  });

  it('permite acesso quando o usuário é ADMIN, mesmo sem ser o dono', async () => {
    repository.findById.mockResolvedValue(fakeProject);
    const context = createContext({
      sub: 'outro-usuario',
      email: 'admin@example.com',
      role: Role.ADMIN,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('permite acesso quando o usuário é SUPER_ADMIN, mesmo sem ser o dono', async () => {
    repository.findById.mockResolvedValue(fakeProject);
    const context = createContext({
      sub: 'outro-usuario',
      email: 'super@example.com',
      role: Role.SUPER_ADMIN,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('lança ForbiddenException quando outro USER (não dono) tenta acessar', async () => {
    repository.findById.mockResolvedValue(fakeProject);
    const context = createContext({
      sub: 'outro-usuario',
      email: 'ana@example.com',
      role: Role.USER,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('lança NotFoundException (não ForbiddenException) quando o projeto não existe', async () => {
    repository.findById.mockResolvedValue(null);
    const context = createContext({
      sub: 'qualquer-usuario',
      email: 'ana@example.com',
      role: Role.USER,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('busca o projeto pelo id do path, não por um id fixo', async () => {
    repository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      'outro-id',
    );

    await guard.canActivate(context);

    expect(repository.findById).toHaveBeenCalledWith('outro-id');
  });
});
