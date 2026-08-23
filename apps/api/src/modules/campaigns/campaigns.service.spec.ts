import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsRepository } from './repositories/campaigns.repository';
import { Campaign, CampaignStatus } from '../../../generated/prisma/client';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let repository: jest.Mocked<CampaignsRepository>;

  const fakeCampaign: Campaign = {
    id: 'c1',
    name: 'Campanha X',
    description: null,
    status: CampaignStatus.ACTIVE,
    projectId: 'p1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: CampaignsRepository,
          useValue: {
            findById: jest.fn(),
            findManyByProject: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CampaignsService);
    repository = module.get(CampaignsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria a campanha com o projectId informado', async () => {
      repository.create.mockResolvedValue(fakeCampaign);

      const result = await service.create('p1', {
        name: 'Campanha X',
        description: 'desc',
      });

      expect(repository.create).toHaveBeenCalledWith({
        projectId: 'p1',
        name: 'Campanha X',
        description: 'desc',
      });
      expect(result).toEqual(fakeCampaign);
    });

    it('delega ao repository mesmo sem description', async () => {
      repository.create.mockResolvedValue(fakeCampaign);

      await service.create('p1', { name: 'Campanha X' });

      expect(repository.create).toHaveBeenCalledWith({
        projectId: 'p1',
        name: 'Campanha X',
        description: undefined,
      });
    });
  });

  describe('findById', () => {
    it('retorna a campanha quando encontrada', async () => {
      repository.findById.mockResolvedValue(fakeCampaign);
      await expect(service.findById('c1')).resolves.toEqual(fakeCampaign);
    });

    it('lança NotFoundException quando não encontrada', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza apenas o nome quando somente name é informado', async () => {
      repository.findById.mockResolvedValue(fakeCampaign);
      const updated = { ...fakeCampaign, name: 'Novo nome' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update('c1', { name: 'Novo nome' });

      expect(repository.update).toHaveBeenCalledWith('c1', {
        name: 'Novo nome',
      });
      expect(result).toEqual(updated);
    });

    it('atualiza apenas a descrição quando somente description é informado', async () => {
      repository.findById.mockResolvedValue(fakeCampaign);
      const updated = { ...fakeCampaign, description: 'Nova descrição' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update('c1', {
        description: 'Nova descrição',
      });

      expect(repository.update).toHaveBeenCalledWith('c1', {
        description: 'Nova descrição',
      });
      expect(result).toEqual(updated);
    });

    it('aceita atualização parcial com ambos os campos informados', async () => {
      repository.findById.mockResolvedValue(fakeCampaign);
      const updated = {
        ...fakeCampaign,
        name: 'Novo nome',
        description: 'Nova descrição',
      };
      repository.update.mockResolvedValue(updated);

      await service.update('c1', {
        name: 'Novo nome',
        description: 'Nova descrição',
      });

      expect(repository.update).toHaveBeenCalledWith('c1', {
        name: 'Novo nome',
        description: 'Nova descrição',
      });
    });

    it('lança BadRequestException quando nenhum campo é informado', async () => {
      await expect(service.update('c1', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando a campanha não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('inexistente', { name: 'Novo nome' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('arquiva uma campanha ACTIVE', async () => {
      repository.findById.mockResolvedValue(fakeCampaign);
      const archived = { ...fakeCampaign, status: CampaignStatus.ARCHIVED };
      repository.updateStatus.mockResolvedValue(archived);

      const result = await service.archive('c1');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'c1',
        CampaignStatus.ARCHIVED,
      );
      expect(result).toEqual(archived);
    });

    it('lança NotFoundException quando a campanha não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.archive('inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('lança ConflictException quando a campanha já está ARCHIVED', async () => {
      repository.findById.mockResolvedValue({
        ...fakeCampaign,
        status: CampaignStatus.ARCHIVED,
      });

      await expect(service.archive('c1')).rejects.toThrow(ConflictException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('filtra por ACTIVE por padrão quando status é omitido', async () => {
      repository.findManyByProject.mockResolvedValue({
        items: [fakeCampaign],
        total: 1,
      });

      const result = await service.list('p1', { page: 1, limit: 20 });

      expect(repository.findManyByProject).toHaveBeenCalledWith({
        projectId: 'p1',
        status: CampaignStatus.ACTIVE,
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({
        items: [fakeCampaign],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it("não filtra por status quando status é 'ALL'", async () => {
      repository.findManyByProject.mockResolvedValue({ items: [], total: 0 });

      await service.list('p1', { page: 1, limit: 20, status: 'ALL' });

      expect(repository.findManyByProject).toHaveBeenCalledWith({
        projectId: 'p1',
        status: undefined,
        skip: 0,
        take: 20,
      });
    });

    it('repassa um status explícito (ARCHIVED) sem alterá-lo', async () => {
      repository.findManyByProject.mockResolvedValue({ items: [], total: 0 });

      await service.list('p1', {
        page: 1,
        limit: 20,
        status: CampaignStatus.ARCHIVED,
      });

      expect(repository.findManyByProject).toHaveBeenCalledWith(
        expect.objectContaining({ status: CampaignStatus.ARCHIVED }),
      );
    });

    it('calcula skip a partir de page/limit e totalPages a partir do total', async () => {
      repository.findManyByProject.mockResolvedValue({
        items: [],
        total: 45,
      });

      const result = await service.list('p1', { page: 3, limit: 20 });

      expect(repository.findManyByProject).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
      expect(result.meta).toEqual({
        page: 3,
        limit: 20,
        total: 45,
        totalPages: 3,
      });
    });

    it('delega corretamente para findManyByProject com o projectId informado', async () => {
      repository.findManyByProject.mockResolvedValue({ items: [], total: 0 });

      await service.list('p2', { page: 1, limit: 10 });

      expect(repository.findManyByProject).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'p2' }),
      );
    });
  });
});
