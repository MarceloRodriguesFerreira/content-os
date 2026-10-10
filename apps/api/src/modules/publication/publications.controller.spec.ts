import { Test } from '@nestjs/testing';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';
import { PublicationsRepository } from './repositories/publications.repository';
import { ContentsRepository } from '../content/repositories/contents.repository';
import { CampaignsRepository } from '../campaigns/repositories/campaigns.repository';
import { ProjectsRepository } from '../projects/repositories/projects.repository';
import {
  Publication,
  PublicationChannel,
  PublicationStatus,
} from '../../../generated/prisma/client';

describe('PublicationsController', () => {
  let controller: PublicationsController;
  let publicationsService: jest.Mocked<PublicationsService>;

  const fakePublication: Publication = {
    id: 'pb1',
    contentId: 'ct1',
    channel: PublicationChannel.INSTAGRAM,
    status: PublicationStatus.DRAFT,
    scheduledAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PublicationsController],
      providers: [
        {
          provide: PublicationsService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            schedule: jest.fn(),
            unschedule: jest.fn(),
            list: jest.fn(),
          },
        },
        // Não usados diretamente pelos testes abaixo — mas as rotas usam
        // @UseGuards(PublicationOwnershipGuard), e o Nest resolve as
        // dependências do guard ao montar o TestingModule. O
        // comportamento do guard em si já é coberto, isoladamente, por
        // publication-ownership.guard.spec.ts — mesmo padrão de
        // contents.controller.spec.ts.
        {
          provide: PublicationsRepository,
          useValue: { findById: jest.fn() },
        },
        { provide: ContentsRepository, useValue: { findById: jest.fn() } },
        { provide: CampaignsRepository, useValue: { findById: jest.fn() } },
        { provide: ProjectsRepository, useValue: { findById: jest.fn() } },
      ],
    }).compile();

    controller = module.get(PublicationsController);
    publicationsService = module.get(PublicationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria a publication com o contentId da rota', async () => {
      publicationsService.create.mockResolvedValue(fakePublication);

      const result = await controller.create('ct1', {
        channel: PublicationChannel.INSTAGRAM,
      });

      expect(publicationsService.create).toHaveBeenCalledWith('ct1', {
        channel: PublicationChannel.INSTAGRAM,
      });
      expect(result.id).toBe('pb1');
      expect(result.contentId).toBe('ct1');
      expect(result.status).toBe(PublicationStatus.DRAFT);
    });
  });

  describe('list', () => {
    it('delega para publicationsService.list com o contentId da rota e a query, mapeando items', async () => {
      publicationsService.list.mockResolvedValue({
        items: [fakePublication],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const result = await controller.list('ct1', { page: 1, limit: 20 });

      expect(publicationsService.list).toHaveBeenCalledWith('ct1', {
        page: 1,
        limit: 20,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('pb1');
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('delega para publicationsService.findById e mapeia para o DTO', async () => {
      publicationsService.findById.mockResolvedValue(fakePublication);

      const result = await controller.findOne('pb1');

      expect(publicationsService.findById).toHaveBeenCalledWith('pb1');
      expect(result.id).toBe('pb1');
    });
  });

  describe('update', () => {
    it('despacha para publicationsService.schedule quando status alvo é SCHEDULED', async () => {
      const scheduledAt = new Date('2026-11-01T12:00:00.000Z');
      publicationsService.schedule.mockResolvedValue({
        ...fakePublication,
        status: PublicationStatus.SCHEDULED,
        scheduledAt,
      });

      const result = await controller.update('pb1', {
        status: PublicationStatus.SCHEDULED,
        scheduledAt,
      });

      expect(publicationsService.schedule).toHaveBeenCalledWith(
        'pb1',
        scheduledAt,
      );
      expect(publicationsService.unschedule).not.toHaveBeenCalled();
      expect(result.status).toBe(PublicationStatus.SCHEDULED);
    });

    it('despacha para publicationsService.unschedule quando status alvo é DRAFT, ignorando scheduledAt do body', async () => {
      publicationsService.unschedule.mockResolvedValue(fakePublication);

      const result = await controller.update('pb1', {
        status: PublicationStatus.DRAFT,
        scheduledAt: new Date('2026-11-01T12:00:00.000Z'),
      });

      expect(publicationsService.unschedule).toHaveBeenCalledWith('pb1');
      expect(publicationsService.schedule).not.toHaveBeenCalled();
      expect(result.scheduledAt).toBeNull();
    });

    it('não implementa nenhuma regra de validação própria — propaga o que o Service lançar', async () => {
      publicationsService.schedule.mockRejectedValue(
        new Error('scheduledAt é obrigatório para agendar uma publication.'),
      );

      await expect(
        controller.update('pb1', { status: PublicationStatus.SCHEDULED }),
      ).rejects.toThrow(
        'scheduledAt é obrigatório para agendar uma publication.',
      );
    });
  });
});
