import { Test } from '@nestjs/testing';
import { PublicationsRepository } from './publications.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  Publication,
  PublicationChannel,
  PublicationStatus,
} from '../../../../generated/prisma/client';

describe('PublicationsRepository', () => {
  let repository: PublicationsRepository;
  let prisma: {
    publication: {
      findUnique: jest.Mock<
        Promise<Publication | null>,
        [{ where: { id: string } }]
      >;
      findMany: jest.Mock<Promise<Publication[]>, [Record<string, unknown>]>;
      count: jest.Mock<Promise<number>, [Record<string, unknown>]>;
      create: jest.Mock<
        Promise<Publication>,
        [{ data: Record<string, unknown> }]
      >;
      update: jest.Mock<
        Promise<Publication>,
        [{ where: { id: string }; data: Record<string, unknown> }]
      >;
    };
  };

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
    prisma = {
      publication: {
        findUnique: jest.fn<
          Promise<Publication | null>,
          [{ where: { id: string } }]
        >(),
        findMany: jest.fn<Promise<Publication[]>, [Record<string, unknown>]>(),
        count: jest.fn<Promise<number>, [Record<string, unknown>]>(),
        create: jest.fn<
          Promise<Publication>,
          [{ data: Record<string, unknown> }]
        >(),
        update: jest.fn<
          Promise<Publication>,
          [{ where: { id: string }; data: Record<string, unknown> }]
        >(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        PublicationsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(PublicationsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findById', () => {
    it('delega para prisma.publication.findUnique pelo id', async () => {
      prisma.publication.findUnique.mockResolvedValue(fakePublication);

      const result = await repository.findById('pb1');

      expect(prisma.publication.findUnique).toHaveBeenCalledWith({
        where: { id: 'pb1' },
      });
      expect(result).toEqual(fakePublication);
    });

    it('retorna null quando a publication não existe', async () => {
      prisma.publication.findUnique.mockResolvedValue(null);

      await expect(repository.findById('inexistente')).resolves.toBeNull();
    });
  });

  describe('findManyByContent', () => {
    it('filtra por contentId e status quando informado, com paginação', async () => {
      prisma.publication.findMany.mockResolvedValue([fakePublication]);
      prisma.publication.count.mockResolvedValue(1);

      const result = await repository.findManyByContent({
        contentId: 'ct1',
        status: PublicationStatus.DRAFT,
        skip: 0,
        take: 20,
      });

      const expectedWhere = {
        contentId: 'ct1',
        status: PublicationStatus.DRAFT,
      };
      expect(prisma.publication.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.publication.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(result).toEqual({ items: [fakePublication], total: 1 });
    });

    it('não aplica filtro de status quando omitido', async () => {
      prisma.publication.findMany.mockResolvedValue([]);
      prisma.publication.count.mockResolvedValue(0);

      await repository.findManyByContent({
        contentId: 'ct1',
        skip: 0,
        take: 20,
      });

      const expectedWhere = { contentId: 'ct1' };
      expect(prisma.publication.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.publication.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });

    it('respeita skip/take repassados para a paginação', async () => {
      prisma.publication.findMany.mockResolvedValue([]);
      prisma.publication.count.mockResolvedValue(0);

      await repository.findManyByContent({
        contentId: 'ct1',
        skip: 40,
        take: 20,
      });

      expect(prisma.publication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
    });

    it('comprova que um mesmo Content pode possuir mais de uma Publication', async () => {
      const segunda: Publication = {
        ...fakePublication,
        id: 'pb2',
        channel: PublicationChannel.INSTAGRAM,
        status: PublicationStatus.SCHEDULED,
        scheduledAt: new Date('2026-10-01T12:00:00.000Z'),
      };
      prisma.publication.findMany.mockResolvedValue([fakePublication, segunda]);
      prisma.publication.count.mockResolvedValue(2);

      const result = await repository.findManyByContent({
        contentId: 'ct1',
        skip: 0,
        take: 20,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.every((p) => p.contentId === 'ct1')).toBe(true);
      expect(result.items.map((p) => p.id)).toEqual(['pb1', 'pb2']);
      expect(result.total).toBe(2);
    });
  });

  describe('create', () => {
    it('cria a publication com contentId e channel, sem enviar scheduledAt quando omitido', async () => {
      prisma.publication.create.mockResolvedValue(fakePublication);

      const result = await repository.create({
        contentId: 'ct1',
        channel: PublicationChannel.INSTAGRAM,
      });

      expect(prisma.publication.create).toHaveBeenCalledWith({
        data: {
          contentId: 'ct1',
          channel: PublicationChannel.INSTAGRAM,
        },
      });
      const callArgs = prisma.publication.create.mock.calls[0][0];
      expect(callArgs.data).not.toHaveProperty('scheduledAt');
      expect(result).toEqual(fakePublication);
    });

    it('inclui scheduledAt no objeto persistido quando informado', async () => {
      const scheduledAt = new Date('2026-10-01T12:00:00.000Z');
      const created = { ...fakePublication, scheduledAt };
      prisma.publication.create.mockResolvedValue(created);

      const result = await repository.create({
        contentId: 'ct1',
        channel: PublicationChannel.INSTAGRAM,
        scheduledAt,
      });

      expect(prisma.publication.create).toHaveBeenCalledWith({
        data: {
          contentId: 'ct1',
          channel: PublicationChannel.INSTAGRAM,
          scheduledAt,
        },
      });
      expect(result.scheduledAt).toEqual(scheduledAt);
    });

    it('não recebe nem persiste ownerId — ownership é sempre derivada de Content', async () => {
      prisma.publication.create.mockResolvedValue(fakePublication);

      await repository.create({
        contentId: 'ct1',
        channel: PublicationChannel.INSTAGRAM,
      });

      const callArgs = prisma.publication.create.mock.calls[0][0];
      expect(callArgs.data).not.toHaveProperty('ownerId');
    });
  });

  describe('update', () => {
    it('persiste channel pelo id', async () => {
      const updated = {
        ...fakePublication,
        channel: PublicationChannel.INSTAGRAM,
      };
      prisma.publication.update.mockResolvedValue(updated);

      const result = await repository.update('pb1', {
        channel: PublicationChannel.INSTAGRAM,
      });

      expect(prisma.publication.update).toHaveBeenCalledWith({
        where: { id: 'pb1' },
        data: { channel: PublicationChannel.INSTAGRAM },
      });
      expect(result).toEqual(updated);
    });

    it('persiste status pelo id', async () => {
      const updated = {
        ...fakePublication,
        status: PublicationStatus.SCHEDULED,
      };
      prisma.publication.update.mockResolvedValue(updated);

      const result = await repository.update('pb1', {
        status: PublicationStatus.SCHEDULED,
      });

      expect(prisma.publication.update).toHaveBeenCalledWith({
        where: { id: 'pb1' },
        data: { status: PublicationStatus.SCHEDULED },
      });
      expect(result).toEqual(updated);
    });

    it('persiste scheduledAt pelo id, ao agendar', async () => {
      const scheduledAt = new Date('2026-10-05T09:00:00.000Z');
      const updated = { ...fakePublication, scheduledAt };
      prisma.publication.update.mockResolvedValue(updated);

      const result = await repository.update('pb1', { scheduledAt });

      expect(prisma.publication.update).toHaveBeenCalledWith({
        where: { id: 'pb1' },
        data: { scheduledAt },
      });
      expect(result.scheduledAt).toEqual(scheduledAt);
    });

    it('persiste scheduledAt nulo pelo id, ao desagendar', async () => {
      const updated = { ...fakePublication, scheduledAt: null };
      prisma.publication.update.mockResolvedValue(updated);

      const result = await repository.update('pb1', { scheduledAt: null });

      expect(prisma.publication.update).toHaveBeenCalledWith({
        where: { id: 'pb1' },
        data: { scheduledAt: null },
      });
      expect(result.scheduledAt).toBeNull();
    });
  });

  describe('contrato de exclusão', () => {
    it('não expõe nenhum método de remoção (sem DELETE físico nesta sprint)', () => {
      expect(
        (repository as unknown as Record<string, unknown>).delete,
      ).toBeUndefined();
      expect(
        (repository as unknown as Record<string, unknown>).remove,
      ).toBeUndefined();
    });
  });

  describe('contrato com Content (FK contentId)', () => {
    /**
     * O Repository não carrega relações (sem `include`/`select` de
     * `content`), mesmo padrão de `ContentsRepository` (que também não
     * inclui `campaign`). A relação estrutural Publication.contentId →
     * Content.id / Content.publications → Publication[] é garantida pelo
     * schema Prisma (FK + índice, ver migration), não por este método —
     * este teste comprova apenas o contrato real do Repository: o valor
     * de `contentId` passado é o mesmo persistido/devolvido, e nenhum
     * `include` é acionado.
     */
    it('encaminha contentId ao Prisma em create e o devolve em findById, sem incluir relações', async () => {
      prisma.publication.findUnique.mockResolvedValue(fakePublication);
      prisma.publication.create.mockResolvedValue(fakePublication);

      const found = await repository.findById('pb1');
      const created = await repository.create({
        contentId: 'ct1',
        channel: PublicationChannel.INSTAGRAM,
      });

      expect(prisma.publication.findUnique).toHaveBeenCalledWith({
        where: { id: 'pb1' },
      });
      expect(prisma.publication.create).toHaveBeenCalledWith({
        data: { contentId: 'ct1', channel: PublicationChannel.INSTAGRAM },
      });
      expect(found?.contentId).toBe('ct1');
      expect(created.contentId).toBe('ct1');
    });
  });
});
