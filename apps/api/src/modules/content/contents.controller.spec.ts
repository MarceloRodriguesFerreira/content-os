import { Test } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { ContentsRepository } from './repositories/contents.repository';
import { CampaignsRepository } from '../campaigns/repositories/campaigns.repository';
import { ProjectsRepository } from '../projects/repositories/projects.repository';
import { ContentOwnershipGuard } from './guards/content-ownership.guard';
import { Content, ContentStatus } from '../../../generated/prisma/client';

describe('ContentsController', () => {
  let controller: ContentsController;
  let contentsService: jest.Mocked<ContentsService>;
  let contentsRepository: jest.Mocked<ContentsRepository>;
  let campaignsRepository: jest.Mocked<CampaignsRepository>;
  let projectsRepository: jest.Mocked<ProjectsRepository>;

  const fakeContent: Content = {
    id: 'ct1',
    name: 'Conteúdo X',
    body: null,
    status: ContentStatus.ACTIVE,
    campaignId: 'c1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ContentsController],
      providers: [
        {
          provide: ContentsService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            archive: jest.fn(),
            list: jest.fn(),
          },
        },
        // Não usados diretamente pelos testes abaixo — mas as rotas usam
        // @UseGuards(ContentOwnershipGuard), e o Nest resolve as
        // dependências do guard (ContentsRepository, CampaignsRepository,
        // ProjectsRepository) ao montar o TestingModule, mesmo sem
        // nenhuma requisição HTTP real disparar o guard. O comportamento
        // do guard em si já é coberto, isoladamente, por
        // content-ownership.guard.spec.ts — mesmo padrão de
        // campaigns.controller.spec.ts.
        {
          provide: ContentsRepository,
          useValue: { findById: jest.fn() },
        },
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

    controller = module.get(ContentsController);
    contentsService = module.get(ContentsService);
    contentsRepository = module.get(ContentsRepository);
    campaignsRepository = module.get(CampaignsRepository);
    projectsRepository = module.get(ProjectsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria o conteúdo com o campaignId da rota', async () => {
      contentsService.create.mockResolvedValue(fakeContent);

      const result = await controller.create('c1', {
        name: 'Conteúdo X',
        body: undefined,
      });

      expect(contentsService.create).toHaveBeenCalledWith('c1', {
        name: 'Conteúdo X',
        body: undefined,
      });
      expect(result.id).toBe('ct1');
      expect(result.campaignId).toBe('c1');
    });
  });

  describe('list', () => {
    it('delega para contentsService.list com o campaignId da rota e a query, mapeando items', async () => {
      contentsService.list.mockResolvedValue({
        items: [fakeContent],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const result = await controller.list('c1', {
        page: 1,
        limit: 20,
        status: 'ALL',
      });

      expect(contentsService.list).toHaveBeenCalledWith('c1', {
        page: 1,
        limit: 20,
        status: 'ALL',
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('ct1');
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('delega para contentsService.findById e mapeia para o DTO', async () => {
      contentsService.findById.mockResolvedValue(fakeContent);

      const result = await controller.findOne('ct1');

      expect(contentsService.findById).toHaveBeenCalledWith('ct1');
      expect(result.id).toBe('ct1');
      expect(result.status).toBe(ContentStatus.ACTIVE);
    });
  });

  describe('update', () => {
    it('delega para contentsService.update com id e dto', async () => {
      const updated = { ...fakeContent, name: 'Novo nome' };
      contentsService.update.mockResolvedValue(updated);

      const result = await controller.update('ct1', { name: 'Novo nome' });

      expect(contentsService.update).toHaveBeenCalledWith('ct1', {
        name: 'Novo nome',
      });
      expect(result.name).toBe('Novo nome');
    });
  });

  describe('archive', () => {
    it('delega para contentsService.archive', async () => {
      const archived = { ...fakeContent, status: ContentStatus.ARCHIVED };
      contentsService.archive.mockResolvedValue(archived);

      const result = await controller.archive('ct1');

      expect(contentsService.archive).toHaveBeenCalledWith('ct1');
      expect(result.status).toBe(ContentStatus.ARCHIVED);
    });
  });

  describe('sem acesso direto a Repository/Prisma', () => {
    it('nenhuma operação do Controller chama Contents/Campaigns/ProjectsRepository diretamente', async () => {
      contentsService.create.mockResolvedValue(fakeContent);
      contentsService.findById.mockResolvedValue(fakeContent);
      contentsService.update.mockResolvedValue(fakeContent);
      contentsService.archive.mockResolvedValue(fakeContent);
      contentsService.list.mockResolvedValue({
        items: [fakeContent],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      await controller.create('c1', { name: 'Conteúdo X' });
      await controller.findOne('ct1');
      await controller.update('ct1', { name: 'Novo nome' });
      await controller.archive('ct1');
      await controller.list('c1', { page: 1, limit: 20 });

      // O Controller delega tudo ao Service; os repositories só existem
      // no módulo de teste como dependência do Guard (não exercitado
      // aqui, já que o guard não intercepta chamadas diretas ao método
      // do Controller em um teste unitário sem pipeline HTTP real).
      expect(contentsRepository.findById).not.toHaveBeenCalled();
      expect(campaignsRepository.findById).not.toHaveBeenCalled();
      expect(projectsRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('ContentOwnershipGuard aplicado nas 5 rotas (correção auditoria)', () => {
    // Demonstra, por metadado (sem executar HTTP), a decisão tomada após
    // a auditoria solicitada: ContentOwnershipGuard (Bloco B, inalterado)
    // já foi projetado para os dois contextos — com :id (resolve e
    // valida o Content antes de tudo) e sem :id, em create/list (a
    // resolução começa direto pela Campaign) —, comprovado
    // separadamente por content-ownership.guard.spec.ts (Caso 9, Bloco
    // B, pré-existente). Não há necessidade de um segundo guard: aqui
    // confirma-se apenas que o *mesmo* guard está de fato registrado, via
    // @UseGuards, nos cinco handlers do Controller — create e list
    // incluídos —, e não apenas nos três que têm :id.
    it.each(['create', 'list', 'findOne', 'update', 'archive'])(
      '%s carrega ContentOwnershipGuard em @UseGuards',
      (method) => {
        const prototype = ContentsController.prototype as unknown as Record<
          string,
          (...args: unknown[]) => unknown
        >;
        const guards = Reflect.getMetadata(
          GUARDS_METADATA,
          prototype[method],
        ) as unknown[] | undefined;

        expect(guards ?? []).toContain(ContentOwnershipGuard);
      },
    );
  });
});
