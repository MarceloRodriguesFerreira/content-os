import { Test } from '@nestjs/testing';
import { CampaignsRepository } from './campaigns.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Campaign, CampaignStatus } from '../../../../generated/prisma/client';

describe('CampaignsRepository', () => {
  let repository: CampaignsRepository;
  let prisma: {
    campaign: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

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
    prisma = {
      campaign: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        CampaignsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(CampaignsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findById', () => {
    it('delega para prisma.campaign.findUnique pelo id', async () => {
      prisma.campaign.findUnique.mockResolvedValue(fakeCampaign);

      const result = await repository.findById('c1');

      expect(prisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(result).toEqual(fakeCampaign);
    });

    it('retorna null quando a campanha não existe', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(repository.findById('inexistente')).resolves.toBeNull();
    });
  });

  describe('findManyByProject', () => {
    it('filtra por projectId e status quando informado, com paginação', async () => {
      prisma.campaign.findMany.mockResolvedValue([fakeCampaign]);
      prisma.campaign.count.mockResolvedValue(1);

      const result = await repository.findManyByProject({
        projectId: 'p1',
        status: CampaignStatus.ACTIVE,
        skip: 0,
        take: 20,
      });

      const expectedWhere = { projectId: 'p1', status: CampaignStatus.ACTIVE };
      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.campaign.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(result).toEqual({ items: [fakeCampaign], total: 1 });
    });

    it('não aplica filtro de status quando omitido', async () => {
      prisma.campaign.findMany.mockResolvedValue([]);
      prisma.campaign.count.mockResolvedValue(0);

      await repository.findManyByProject({
        projectId: 'p1',
        skip: 0,
        take: 20,
      });

      const expectedWhere = { projectId: 'p1' };
      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.campaign.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });

    it('respeita skip/take repassados para a paginação', async () => {
      prisma.campaign.findMany.mockResolvedValue([]);
      prisma.campaign.count.mockResolvedValue(0);

      await repository.findManyByProject({
        projectId: 'p1',
        skip: 40,
        take: 20,
      });

      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
    });
  });

  describe('create', () => {
    it('cria a campanha com projectId, name e description', async () => {
      prisma.campaign.create.mockResolvedValue(fakeCampaign);

      const result = await repository.create({
        projectId: 'p1',
        name: 'Campanha X',
        description: undefined,
      });

      expect(prisma.campaign.create).toHaveBeenCalledWith({
        data: { projectId: 'p1', name: 'Campanha X', description: undefined },
      });
      expect(result).toEqual(fakeCampaign);
    });
  });

  describe('update', () => {
    it('atualiza campos parciais pelo id', async () => {
      const updated = { ...fakeCampaign, name: 'Novo nome' };
      prisma.campaign.update.mockResolvedValue(updated);

      const result = await repository.update('c1', { name: 'Novo nome' });

      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { name: 'Novo nome' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('updateStatus', () => {
    it('atualiza apenas o status pelo id', async () => {
      const archived = { ...fakeCampaign, status: CampaignStatus.ARCHIVED };
      prisma.campaign.update.mockResolvedValue(archived);

      const result = await repository.updateStatus(
        'c1',
        CampaignStatus.ARCHIVED,
      );

      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: CampaignStatus.ARCHIVED },
      });
      expect(result).toEqual(archived);
    });
  });
});
