import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PublicationsService } from './publications.service';
import { PublicationsRepository } from './repositories/publications.repository';
import {
  Publication,
  PublicationChannel,
  PublicationStatus,
} from '../../../generated/prisma/client';

describe('PublicationsService', () => {
  let service: PublicationsService;
  let repository: jest.Mocked<PublicationsRepository>;

  const draftPublication: Publication = {
    id: 'pb1',
    contentId: 'ct1',
    channel: PublicationChannel.INSTAGRAM,
    status: PublicationStatus.DRAFT,
    scheduledAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const scheduledPublication: Publication = {
    ...draftPublication,
    status: PublicationStatus.SCHEDULED,
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PublicationsService,
        {
          provide: PublicationsRepository,
          useValue: {
            findById: jest.fn(),
            findManyByContent: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PublicationsService);
    repository = module.get(PublicationsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria sempre em DRAFT, sem scheduledAt — o contrato nem aceita esse campo', async () => {
      repository.create.mockResolvedValue(draftPublication);

      const result = await service.create('ct1', {
        channel: PublicationChannel.INSTAGRAM,
      });

      expect(repository.create).toHaveBeenCalledWith({
        contentId: 'ct1',
        channel: PublicationChannel.INSTAGRAM,
      });
      const callArgs = repository.create.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('scheduledAt');
      expect(result.status).toBe(PublicationStatus.DRAFT);
      expect(result.scheduledAt).toBeNull();
    });
  });

  describe('findById', () => {
    it('retorna a publication quando encontrada', async () => {
      repository.findById.mockResolvedValue(draftPublication);

      await expect(service.findById('pb1')).resolves.toEqual(draftPublication);
    });

    it('lança NotFoundException quando a publication não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('schedule (DRAFT → SCHEDULED)', () => {
    it('agenda com scheduledAt futuro', async () => {
      const scheduledAt = new Date(Date.now() + 1000 * 60 * 60);
      repository.findById.mockResolvedValue(draftPublication);
      repository.update.mockResolvedValue({
        ...draftPublication,
        status: PublicationStatus.SCHEDULED,
        scheduledAt,
      });

      const result = await service.schedule('pb1', scheduledAt);

      expect(repository.update).toHaveBeenCalledWith('pb1', {
        status: PublicationStatus.SCHEDULED,
        scheduledAt,
      });
      expect(result.status).toBe(PublicationStatus.SCHEDULED);
    });

    it('rejeita quando a publication não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.schedule('inexistente', new Date(Date.now() + 1000)),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rejeita sem scheduledAt', async () => {
      repository.findById.mockResolvedValue(draftPublication);

      await expect(service.schedule('pb1', undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rejeita scheduledAt no passado', async () => {
      repository.findById.mockResolvedValue(draftPublication);

      await expect(
        service.schedule('pb1', new Date(Date.now() - 1000)),
      ).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rejeita scheduledAt igual ao instante atual (não estritamente futuro)', async () => {
      repository.findById.mockResolvedValue(draftPublication);

      await expect(
        service.schedule('pb1', new Date(Date.now())),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita (409) agendar uma publication que já está SCHEDULED — transição não permitida', async () => {
      repository.findById.mockResolvedValue(scheduledPublication);

      await expect(
        service.schedule('pb1', new Date(Date.now() + 1000 * 60)),
      ).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('unschedule (SCHEDULED → DRAFT)', () => {
    it('desagenda e limpa scheduledAt', async () => {
      repository.findById.mockResolvedValue(scheduledPublication);
      repository.update.mockResolvedValue(draftPublication);

      const result = await service.unschedule('pb1');

      expect(repository.update).toHaveBeenCalledWith('pb1', {
        status: PublicationStatus.DRAFT,
        scheduledAt: null,
      });
      expect(result.scheduledAt).toBeNull();
      expect(result.status).toBe(PublicationStatus.DRAFT);
    });

    it('rejeita quando a publication não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.unschedule('inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rejeita (409) desagendar uma publication que já está DRAFT — transição não permitida', async () => {
      repository.findById.mockResolvedValue(draftPublication);

      await expect(service.unschedule('pb1')).rejects.toThrow(
        ConflictException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('traduz page/limit para skip/take e repassa status quando informado', async () => {
      repository.findManyByContent.mockResolvedValue({
        items: [draftPublication],
        total: 1,
      });

      const result = await service.list('ct1', {
        page: 2,
        limit: 10,
        status: PublicationStatus.DRAFT,
      });

      expect(repository.findManyByContent).toHaveBeenCalledWith({
        contentId: 'ct1',
        status: PublicationStatus.DRAFT,
        skip: 10,
        take: 10,
      });
      expect(result).toEqual({
        items: [draftPublication],
        meta: { page: 2, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('não filtra por status quando omitido — lista DRAFT e SCHEDULED juntos', async () => {
      repository.findManyByContent.mockResolvedValue({
        items: [draftPublication, scheduledPublication],
        total: 2,
      });

      await service.list('ct1', { page: 1, limit: 20 });

      expect(repository.findManyByContent).toHaveBeenCalledWith({
        contentId: 'ct1',
        status: undefined,
        skip: 0,
        take: 20,
      });
    });
  });
});
