import { Test } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './repositories/projects.repository';
import { Project, ProjectStatus, Role } from '../../../generated/prisma/client';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let projectsService: jest.Mocked<ProjectsService>;

  const fakeProject: Project = {
    id: 'p1',
    name: 'Projeto X',
    description: null,
    status: ProjectStatus.ACTIVE,
    ownerId: 'u1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const currentUser = { sub: 'u1', email: 'ana@example.com', role: Role.USER };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            archive: jest.fn(),
            restore: jest.fn(),
            list: jest.fn(),
          },
        },
        // Não usado diretamente pelos testes abaixo — mas @UseGuards(
        // ProjectOwnershipGuard) nas rotas :id faz o Nest tentar resolver
        // as dependências do guard (ProjectsRepository) ao montar o
        // TestingModule, mesmo sem nenhuma requisição HTTP real disparar o
        // guard (compile() já instancia todos os providers referenciados
        // por metadata). O comportamento do guard em si já é coberto,
        // isoladamente, por project-ownership.guard.spec.ts.
        {
          provide: ProjectsRepository,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(ProjectsController);
    projectsService = module.get(ProjectsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria o projeto com o sub do usuário autenticado como ownerId', async () => {
      projectsService.create.mockResolvedValue(fakeProject);

      const result = await controller.create(
        { name: 'Projeto X', description: undefined },
        currentUser,
      );

      expect(projectsService.create).toHaveBeenCalledWith('u1', {
        name: 'Projeto X',
        description: undefined,
      });
      expect(result.id).toBe('p1');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('delega para projectsService.findById e mapeia para o DTO', async () => {
      projectsService.findById.mockResolvedValue(fakeProject);

      const result = await controller.findOne('p1');

      expect(projectsService.findById).toHaveBeenCalledWith('p1');
      expect(result.id).toBe('p1');
      expect(result.status).toBe(ProjectStatus.ACTIVE);
    });
  });

  describe('update', () => {
    it('delega para projectsService.update com id e dto', async () => {
      const updated = { ...fakeProject, name: 'Novo nome' };
      projectsService.update.mockResolvedValue(updated);

      const result = await controller.update('p1', { name: 'Novo nome' });

      expect(projectsService.update).toHaveBeenCalledWith('p1', {
        name: 'Novo nome',
      });
      expect(result.name).toBe('Novo nome');
    });
  });

  describe('archive', () => {
    it('delega para projectsService.archive', async () => {
      const archived = { ...fakeProject, status: ProjectStatus.ARCHIVED };
      projectsService.archive.mockResolvedValue(archived);

      const result = await controller.archive('p1');

      expect(projectsService.archive).toHaveBeenCalledWith('p1');
      expect(result.status).toBe(ProjectStatus.ARCHIVED);
    });
  });

  describe('restore', () => {
    it('delega para projectsService.restore', async () => {
      projectsService.restore.mockResolvedValue(fakeProject);

      const result = await controller.restore('p1');

      expect(projectsService.restore).toHaveBeenCalledWith('p1');
      expect(result.status).toBe(ProjectStatus.ACTIVE);
    });
  });

  describe('list', () => {
    it('delega para projectsService.list com o sub do usuário e a query, mapeando items', async () => {
      projectsService.list.mockResolvedValue({
        items: [fakeProject],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const result = await controller.list(
        { page: 1, limit: 20, status: 'ALL' },
        currentUser,
      );

      expect(projectsService.list).toHaveBeenCalledWith('u1', {
        page: 1,
        limit: 20,
        status: 'ALL',
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('p1');
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });
  });
});
