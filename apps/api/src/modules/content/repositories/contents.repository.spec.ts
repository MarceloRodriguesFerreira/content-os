import { Test } from '@nestjs/testing';
import { ContentsRepository } from './contents.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Content, ContentStatus } from '../../../../generated/prisma/client';

describe('ContentsRepository', () => {
  let repository: ContentsRepository;
  let prisma: {
    content: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

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
    prisma = {
      content: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        ContentsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(ContentsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findById', () => {
    it('delega para prisma.content.findUnique pelo id', async () => {
      prisma.content.findUnique.mockResolvedValue(fakeContent);

      const result = await repository.findById('ct1');

      expect(prisma.content.findUnique).toHaveBeenCalledWith({
        where: { id: 'ct1' },
      });
      expect(result).toEqual(fakeContent);
    });

    it('retorna null quando o conteúdo não existe', async () => {
      prisma.content.findUnique.mockResolvedValue(null);

      await expect(repository.findById('inexistente')).resolves.toBeNull();
    });
  });

  describe('findManyByCampaign', () => {
    it('filtra por campaignId e status quando informado, com paginação', async () => {
      prisma.content.findMany.mockResolvedValue([fakeContent]);
      prisma.content.count.mockResolvedValue(1);

      const result = await repository.findManyByCampaign({
        campaignId: 'c1',
        status: ContentStatus.ACTIVE,
        skip: 0,
        take: 20,
      });

      const expectedWhere = { campaignId: 'c1', status: ContentStatus.ACTIVE };
      expect(prisma.content.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.content.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(result).toEqual({ items: [fakeContent], total: 1 });
    });

    it('não aplica filtro de status quando omitido', async () => {
      prisma.content.findMany.mockResolvedValue([]);
      prisma.content.count.mockResolvedValue(0);

      await repository.findManyByCampaign({
        campaignId: 'c1',
        skip: 0,
        take: 20,
      });

      const expectedWhere = { campaignId: 'c1' };
      expect(prisma.content.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.content.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });

    it('respeita skip/take repassados para a paginação', async () => {
      prisma.content.findMany.mockResolvedValue([]);
      prisma.content.count.mockResolvedValue(0);

      await repository.findManyByCampaign({
        campaignId: 'c1',
        skip: 40,
        take: 20,
      });

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
    });
  });

  describe('create', () => {
    it('cria o conteúdo com campaignId, name e body', async () => {
      prisma.content.create.mockResolvedValue(fakeContent);

      const result = await repository.create({
        campaignId: 'c1',
        name: 'Post de lançamento',
        body: undefined,
      });

      expect(prisma.content.create).toHaveBeenCalledWith({
        data: { campaignId: 'c1', name: 'Post de lançamento', body: undefined },
      });
      expect(result).toEqual(fakeContent);
    });
  });

  describe('update', () => {
    it('atualiza campos parciais pelo id', async () => {
      const updated = { ...fakeContent, name: 'Novo nome' };
      prisma.content.update.mockResolvedValue(updated);

      const result = await repository.update('ct1', { name: 'Novo nome' });

      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: 'ct1' },
        data: { name: 'Novo nome' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('updateStatus', () => {
    it('atualiza apenas o status pelo id', async () => {
      const archived = { ...fakeContent, status: ContentStatus.ARCHIVED };
      prisma.content.update.mockResolvedValue(archived);

      const result = await repository.updateStatus(
        'ct1',
        ContentStatus.ARCHIVED,
      );

      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: 'ct1' },
        data: { status: ContentStatus.ARCHIVED },
      });
      expect(result).toEqual(archived);
    });
  });
});
