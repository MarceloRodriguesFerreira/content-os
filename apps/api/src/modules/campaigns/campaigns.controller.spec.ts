import { Test } from '@nestjs/testing';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignsRepository } from './repositories/campaigns.repository';
import { ProjectsRepository } from '../projects/repositories/projects.repository';
import { Campaign, CampaignStatus } from '../../../generated/prisma/client';

describe('CampaignsController', () => {
  let controller: CampaignsController;
  let campaignsService: jest.Mocked<CampaignsService>;
  let campaignsRepository: jest.Mocked<CampaignsRepository>;
  let projectsRepository: jest.Mocked<ProjectsRepository>;

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
      controllers: [CampaignsController],
      providers: [
        {
          provide: CampaignsService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            archive: jest.fn(),
            list: jest.fn(),
          },
        },
        // Não usado diretamente pelos testes abaixo — mas as rotas usam
        // @UseGuards(CampaignOwnershipGuard), e o Nest resolve as
        // dependências do guard (CampaignsRepository, ProjectsRepository)
        // ao montar o TestingModule, mesmo sem nenhuma requisição HTTP
        // real disparar o guard. O comportamento do guard em si já é
        // coberto, isoladamente, por campaign-ownership.guard.spec.ts —
        // mesmo padrão de projects.controller.spec.ts.
        {
          provide: CampaignsRepository,
          useValue: { findById: jest.fn() },
        },
        {
          provide: ProjectsRepository,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(CampaignsController);
    campaignsService = module.get(CampaignsService);
    campaignsRepository = module.get(CampaignsRepository);
    projectsRepository = module.get(ProjectsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria a campanha com o projectId da rota', async () => {
      campaignsService.create.mockResolvedValue(fakeCampaign);

      const result = await controller.create('p1', {
        name: 'Campanha X',
        description: undefined,
      });

      expect(campaignsService.create).toHaveBeenCalledWith('p1', {
        name: 'Campanha X',
        description: undefined,
      });
      expect(result.id).toBe('c1');
      expect(result.projectId).toBe('p1');
    });
  });

  describe('list', () => {
    it('delega para campaignsService.list com o projectId da rota e a query, mapeando items', async () => {
      campaignsService.list.mockResolvedValue({
        items: [fakeCampaign],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const result = await controller.list('p1', {
        page: 1,
        limit: 20,
        status: 'ALL',
      });

      expect(campaignsService.list).toHaveBeenCalledWith('p1', {
        page: 1,
        limit: 20,
        status: 'ALL',
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('c1');
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('delega para campaignsService.findById e mapeia para o DTO', async () => {
      campaignsService.findById.mockResolvedValue(fakeCampaign);

      const result = await controller.findOne('c1');

      expect(campaignsService.findById).toHaveBeenCalledWith('c1');
      expect(result.id).toBe('c1');
      expect(result.status).toBe(CampaignStatus.ACTIVE);
    });
  });

  describe('update', () => {
    it('delega para campaignsService.update com id e dto', async () => {
      const updated = { ...fakeCampaign, name: 'Novo nome' };
      campaignsService.update.mockResolvedValue(updated);

      const result = await controller.update('c1', { name: 'Novo nome' });

      expect(campaignsService.update).toHaveBeenCalledWith('c1', {
        name: 'Novo nome',
      });
      expect(result.name).toBe('Novo nome');
    });
  });

  describe('archive', () => {
    it('delega para campaignsService.archive', async () => {
      const archived = { ...fakeCampaign, status: CampaignStatus.ARCHIVED };
      campaignsService.archive.mockResolvedValue(archived);

      const result = await controller.archive('c1');

      expect(campaignsService.archive).toHaveBeenCalledWith('c1');
      expect(result.status).toBe(CampaignStatus.ARCHIVED);
    });
  });

  describe('sem acesso direto a Repository/Prisma', () => {
    it('nenhuma operação do Controller chama CampaignsRepository ou ProjectsRepository diretamente', async () => {
      campaignsService.create.mockResolvedValue(fakeCampaign);
      campaignsService.findById.mockResolvedValue(fakeCampaign);
      campaignsService.update.mockResolvedValue(fakeCampaign);
      campaignsService.archive.mockResolvedValue(fakeCampaign);
      campaignsService.list.mockResolvedValue({
        items: [fakeCampaign],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      await controller.create('p1', { name: 'Campanha X' });
      await controller.findOne('c1');
      await controller.update('c1', { name: 'Novo nome' });
      await controller.archive('c1');
      await controller.list('p1', { page: 1, limit: 20 });

      // O Controller delega tudo ao Service; os repositories só existem
      // no módulo de teste como dependência do Guard (não exercitado
      // aqui, já que o guard não intercepta chamadas diretas ao método
      // do Controller em um teste unitário sem pipeline HTTP real).
      expect(campaignsRepository.findById).not.toHaveBeenCalled();
      expect(projectsRepository.findById).not.toHaveBeenCalled();
    });
  });
});
