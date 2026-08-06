import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './repositories/projects.repository';
import { Project, ProjectStatus } from '../../../generated/prisma/client';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: jest.Mocked<ProjectsRepository>;

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
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepository,
          useValue: {
            findById: jest.fn(),
            findManyByOwner: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProjectsService);
    repository = module.get(ProjectsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria o projeto com o ownerId do usuário autenticado', async () => {
      repository.create.mockResolvedValue(fakeProject);

      const result = await service.create('u1', {
        name: 'Projeto X',
        description: 'desc',
      });

      expect(repository.create).toHaveBeenCalledWith({
        ownerId: 'u1',
        name: 'Projeto X',
        description: 'desc',
      });
      expect(result).toEqual(fakeProject);
    });
  });

  describe('findById', () => {
    it('retorna o projeto quando encontrado', async () => {
      repository.findById.mockResolvedValue(fakeProject);
      await expect(service.findById('p1')).resolves.toEqual(fakeProject);
    });

    it('lança NotFoundException quando não encontrado', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza quando ao menos um campo é informado e o projeto existe', async () => {
      repository.findById.mockResolvedValue(fakeProject);
      const updated = { ...fakeProject, name: 'Novo nome' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update('p1', { name: 'Novo nome' });

      expect(repository.update).toHaveBeenCalledWith('p1', {
        name: 'Novo nome',
      });
      expect(result).toEqual(updated);
    });

    it('permite atualizar mesmo com o projeto ARCHIVED', async () => {
      repository.findById.mockResolvedValue({
        ...fakeProject,
        status: ProjectStatus.ARCHIVED,
      });
      repository.update.mockResolvedValue({
        ...fakeProject,
        status: ProjectStatus.ARCHIVED,
        name: 'Novo nome',
      });

      await expect(
        service.update('p1', { name: 'Novo nome' }),
      ).resolves.toMatchObject({ name: 'Novo nome' });
    });

    it('lança BadRequestException quando nenhum campo é informado', async () => {
      await expect(service.update('p1', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando o projeto não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('inexistente', { name: 'Novo nome' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('arquiva um projeto ACTIVE', async () => {
      repository.findById.mockResolvedValue(fakeProject);
      const archived = { ...fakeProject, status: ProjectStatus.ARCHIVED };
      repository.updateStatus.mockResolvedValue(archived);

      const result = await service.archive('p1');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'p1',
        ProjectStatus.ARCHIVED,
      );
      expect(result).toEqual(archived);
    });

    it('lança ConflictException quando o projeto já está ARCHIVED', async () => {
      repository.findById.mockResolvedValue({
        ...fakeProject,
        status: ProjectStatus.ARCHIVED,
      });

      await expect(service.archive('p1')).rejects.toThrow(ConflictException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando o projeto não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.archive('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('restaura um projeto ARCHIVED', async () => {
      repository.findById.mockResolvedValue({
        ...fakeProject,
        status: ProjectStatus.ARCHIVED,
      });
      repository.updateStatus.mockResolvedValue(fakeProject);

      const result = await service.restore('p1');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'p1',
        ProjectStatus.ACTIVE,
      );
      expect(result).toEqual(fakeProject);
    });

    it('lança ConflictException quando o projeto já está ACTIVE', async () => {
      repository.findById.mockResolvedValue(fakeProject);

      await expect(service.restore('p1')).rejects.toThrow(ConflictException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando o projeto não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.restore('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('filtra por ACTIVE por padrão quando status é omitido', async () => {
      repository.findManyByOwner.mockResolvedValue({
        items: [fakeProject],
        total: 1,
      });

      const result = await service.list('u1', { page: 1, limit: 20 });

      expect(repository.findManyByOwner).toHaveBeenCalledWith({
        ownerId: 'u1',
        status: ProjectStatus.ACTIVE,
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({
        items: [fakeProject],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it("não filtra por status quando status é 'ALL'", async () => {
      repository.findManyByOwner.mockResolvedValue({ items: [], total: 0 });

      await service.list('u1', { page: 1, limit: 20, status: 'ALL' });

      expect(repository.findManyByOwner).toHaveBeenCalledWith({
        ownerId: 'u1',
        status: undefined,
        skip: 0,
        take: 20,
      });
    });

    it('repassa um status explícito (ex.: ARCHIVED) sem alterá-lo', async () => {
      repository.findManyByOwner.mockResolvedValue({ items: [], total: 0 });

      await service.list('u1', {
        page: 1,
        limit: 20,
        status: ProjectStatus.ARCHIVED,
      });

      expect(repository.findManyByOwner).toHaveBeenCalledWith(
        expect.objectContaining({ status: ProjectStatus.ARCHIVED }),
      );
    });

    it('calcula skip a partir de page/limit e totalPages a partir do total', async () => {
      repository.findManyByOwner.mockResolvedValue({
        items: [],
        total: 45,
      });

      const result = await service.list('u1', { page: 3, limit: 20 });

      expect(repository.findManyByOwner).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
      expect(result.meta).toEqual({
        page: 3,
        limit: 20,
        total: 45,
        totalPages: 3,
      });
    });
  });
});
