import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ContentsService } from './contents.service';
import { ContentsRepository } from './repositories/contents.repository';
import { Content, ContentStatus } from '../../../generated/prisma/client';

describe('ContentsService', () => {
  let service: ContentsService;
  let repository: jest.Mocked<ContentsRepository>;

  const fakeContent: Content = {
    id: 'ct1',
    name: 'Post de lançamento',
    body: null,
    status: ContentStatus.ACTIVE,
    campaignId: 'c1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ContentsService,
        {
          provide: ContentsRepository,
          useValue: {
            findById: jest.fn(),
            findManyByCampaign: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ContentsService);
    repository = module.get(ContentsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria o conteúdo com o campaignId informado', async () => {
      repository.create.mockResolvedValue(fakeContent);

      const result = await service.create('c1', {
        name: 'Post de lançamento',
        body: 'corpo do post',
      });

      expect(repository.create).toHaveBeenCalledWith({
        campaignId: 'c1',
        name: 'Post de lançamento',
        body: 'corpo do post',
      });
      expect(result).toEqual(fakeContent);
    });

    it('delega ao repository mesmo sem body', async () => {
      repository.create.mockResolvedValue(fakeContent);

      await service.create('c1', { name: 'Post de lançamento' });

      expect(repository.create).toHaveBeenCalledWith({
        campaignId: 'c1',
        name: 'Post de lançamento',
        body: undefined,
      });
    });
  });

  describe('findById', () => {
    it('retorna o conteúdo quando encontrado', async () => {
      repository.findById.mockResolvedValue(fakeContent);
      await expect(service.findById('ct1')).resolves.toEqual(fakeContent);
    });

    it('lança NotFoundException quando não encontrado', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza apenas o nome quando somente name é informado', async () => {
      repository.findById.mockResolvedValue(fakeContent);
      const updated = { ...fakeContent, name: 'Novo nome' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update('ct1', { name: 'Novo nome' });

      expect(repository.update).toHaveBeenCalledWith('ct1', {
        name: 'Novo nome',
      });
      expect(result).toEqual(updated);
    });

    it('atualiza apenas o body quando somente body é informado', async () => {
      repository.findById.mockResolvedValue(fakeContent);
      const updated = { ...fakeContent, body: 'Novo corpo' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update('ct1', { body: 'Novo corpo' });

      expect(repository.update).toHaveBeenCalledWith('ct1', {
        body: 'Novo corpo',
      });
      expect(result).toEqual(updated);
    });

    it('aceita atualização parcial com ambos os campos informados', async () => {
      repository.findById.mockResolvedValue(fakeContent);
      const updated = {
        ...fakeContent,
        name: 'Novo nome',
        body: 'Novo corpo',
      };
      repository.update.mockResolvedValue(updated);

      await service.update('ct1', { name: 'Novo nome', body: 'Novo corpo' });

      expect(repository.update).toHaveBeenCalledWith('ct1', {
        name: 'Novo nome',
        body: 'Novo corpo',
      });
    });

    it('lança BadRequestException quando nenhum campo é informado', async () => {
      await expect(service.update('ct1', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando o conteúdo não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('inexistente', { name: 'Novo nome' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('arquiva um conteúdo ACTIVE', async () => {
      repository.findById.mockResolvedValue(fakeContent);
      const archived = { ...fakeContent, status: ContentStatus.ARCHIVED };
      repository.updateStatus.mockResolvedValue(archived);

      const result = await service.archive('ct1');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'ct1',
        ContentStatus.ARCHIVED,
      );
      expect(result).toEqual(archived);
    });

    it('lança NotFoundException quando o conteúdo não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.archive('inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('lança ConflictException quando o conteúdo já está ARCHIVED', async () => {
      repository.findById.mockResolvedValue({
        ...fakeContent,
        status: ContentStatus.ARCHIVED,
      });

      await expect(service.archive('ct1')).rejects.toThrow(ConflictException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('filtra por ACTIVE por padrão quando status é omitido', async () => {
      repository.findManyByCampaign.mockResolvedValue({
        items: [fakeContent],
        total: 1,
      });

      const result = await service.list('c1', { page: 1, limit: 20 });

      expect(repository.findManyByCampaign).toHaveBeenCalledWith({
        campaignId: 'c1',
        status: ContentStatus.ACTIVE,
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({
        items: [fakeContent],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it("não filtra por status quando status é 'ALL'", async () => {
      repository.findManyByCampaign.mockResolvedValue({
        items: [],
        total: 0,
      });

      await service.list('c1', { page: 1, limit: 20, status: 'ALL' });

      expect(repository.findManyByCampaign).toHaveBeenCalledWith({
        campaignId: 'c1',
        status: undefined,
        skip: 0,
        take: 20,
      });
    });

    it('repassa um status explícito (ARCHIVED) sem alterá-lo', async () => {
      repository.findManyByCampaign.mockResolvedValue({
        items: [],
        total: 0,
      });

      await service.list('c1', {
        page: 1,
        limit: 20,
        status: ContentStatus.ARCHIVED,
      });

      expect(repository.findManyByCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ status: ContentStatus.ARCHIVED }),
      );
    });

    it('calcula skip a partir de page/limit e totalPages a partir do total', async () => {
      repository.findManyByCampaign.mockResolvedValue({
        items: [],
        total: 45,
      });

      const result = await service.list('c1', { page: 3, limit: 20 });

      expect(repository.findManyByCampaign).toHaveBeenCalledWith(
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
