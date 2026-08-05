import { Test } from '@nestjs/testing';
import { ProjectsRepository } from './projects.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Project, ProjectStatus } from '../../../../generated/prisma/client';

describe('ProjectsRepository', () => {
  let repository: ProjectsRepository;
  let prisma: {
    project: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const fakeProject: Project = {
    id: 'p1',
    name: 'Projeto X',
    description: null,
    status: ProjectStatus.ACTIVE,
    ownerId: 'u1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      project: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        ProjectsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(ProjectsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findById', () => {
    it('delega para prisma.project.findUnique pelo id', async () => {
      prisma.project.findUnique.mockResolvedValue(fakeProject);

      const result = await repository.findById('p1');

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
      expect(result).toEqual(fakeProject);
    });

    it('retorna null quando o projeto não existe', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(repository.findById('inexistente')).resolves.toBeNull();
    });
  });

  describe('findManyByOwner', () => {
    it('filtra por ownerId e status quando informado, com paginação', async () => {
      prisma.project.findMany.mockResolvedValue([fakeProject]);
      prisma.project.count.mockResolvedValue(1);

      const result = await repository.findManyByOwner({
        ownerId: 'u1',
        status: ProjectStatus.ACTIVE,
        skip: 0,
        take: 20,
      });

      const expectedWhere = { ownerId: 'u1', status: ProjectStatus.ACTIVE };
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.project.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(result).toEqual({ items: [fakeProject], total: 1 });
    });

    it('não aplica filtro de status quando omitido', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      await repository.findManyByOwner({ ownerId: 'u1', skip: 0, take: 20 });

      const expectedWhere = { ownerId: 'u1' };
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.project.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });

    it('respeita skip/take repassados para a paginação', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      await repository.findManyByOwner({
        ownerId: 'u1',
        skip: 40,
        take: 20,
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
    });
  });

  describe('create', () => {
    it('cria o projeto com ownerId, name e description', async () => {
      prisma.project.create.mockResolvedValue(fakeProject);

      const result = await repository.create({
        ownerId: 'u1',
        name: 'Projeto X',
        description: undefined,
      });

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { ownerId: 'u1', name: 'Projeto X', description: undefined },
      });
      expect(result).toEqual(fakeProject);
    });
  });

  describe('update', () => {
    it('atualiza campos parciais pelo id', async () => {
      const updated = { ...fakeProject, name: 'Novo nome' };
      prisma.project.update.mockResolvedValue(updated);

      const result = await repository.update('p1', { name: 'Novo nome' });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { name: 'Novo nome' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('updateStatus', () => {
    it('atualiza apenas o status pelo id', async () => {
      const archived = { ...fakeProject, status: ProjectStatus.ARCHIVED };
      prisma.project.update.mockResolvedValue(archived);

      const result = await repository.updateStatus(
        'p1',
        ProjectStatus.ARCHIVED,
      );

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: ProjectStatus.ARCHIVED },
      });
      expect(result).toEqual(archived);
    });
  });
});
