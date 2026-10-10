import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { PublicationOwnershipGuard } from './publication-ownership.guard';
import { PublicationsRepository } from '../repositories/publications.repository';
import { ContentsRepository } from '../../content/repositories/contents.repository';
import { CampaignsRepository } from '../../campaigns/repositories/campaigns.repository';
import { ProjectsRepository } from '../../projects/repositories/projects.repository';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import {
  Campaign,
  CampaignStatus,
  Content,
  ContentStatus,
  Project,
  ProjectStatus,
  Publication,
  PublicationChannel,
  PublicationStatus,
  Role,
} from '../../../../generated/prisma/client';

describe('PublicationOwnershipGuard', () => {
  let guard: PublicationOwnershipGuard;
  let publicationsRepository: jest.Mocked<PublicationsRepository>;
  let contentsRepository: jest.Mocked<ContentsRepository>;
  let campaignsRepository: jest.Mocked<CampaignsRepository>;
  let projectsRepository: jest.Mocked<ProjectsRepository>;

  const fakeProject: Project = {
    id: 'p1',
    name: 'Projeto X',
    description: null,
    status: ProjectStatus.ACTIVE,
    ownerId: 'owner-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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

  const fakeContent: Content = {
    id: 'ct1',
    name: 'Post de lançamento',
    body: null,
    status: ContentStatus.ACTIVE,
    campaignId: 'c1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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

  function createContext(
    user: JwtPayload,
    params: { campaignId: string; contentId: string; id?: string },
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    publicationsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<PublicationsRepository>;

    contentsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ContentsRepository>;

    campaignsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CampaignsRepository>;

    projectsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ProjectsRepository>;

    guard = new PublicationOwnershipGuard(
      publicationsRepository,
      contentsRepository,
      campaignsRepository,
      projectsRepository,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('lança NotFoundException quando a publication não existe', async () => {
    publicationsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', contentId: 'ct1', id: 'pb-inexistente' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(publicationsRepository.findById).toHaveBeenCalledWith(
      'pb-inexistente',
    );
    expect(contentsRepository.findById).not.toHaveBeenCalled();
    expect(campaignsRepository.findById).not.toHaveBeenCalled();
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando a publication pertence a outro content (IDOR)', async () => {
    publicationsRepository.findById.mockResolvedValue(fakePublication); // contentId: 'ct1'
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', contentId: 'ct2', id: 'pb1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(contentsRepository.findById).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando o conteúdo não existe', async () => {
    contentsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', contentId: 'ct-inexistente' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(campaignsRepository.findById).not.toHaveBeenCalled();
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  it('resolve e valida Content mesmo sem :id (create/list) — diferente de ContentOwnershipGuard', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', contentId: 'ct1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(publicationsRepository.findById).not.toHaveBeenCalled();
    expect(contentsRepository.findById).toHaveBeenCalledWith('ct1');
  });

  it('lança NotFoundException quando o conteúdo pertence a outra campanha (inconsistência de campaignId)', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent); // campaignId: 'c1'
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c2', contentId: 'ct1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(campaignsRepository.findById).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando a campanha não existe', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', contentId: 'ct1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando o projeto associado não existe', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', contentId: 'ct1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(projectsRepository.findById).toHaveBeenCalledWith('p1');
  });

  it('permite acesso quando toda a cadeia é consistente e o usuário é dono do projeto', async () => {
    publicationsRepository.findById.mockResolvedValue(fakePublication);
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', contentId: 'ct1', id: 'pb1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(publicationsRepository.findById).toHaveBeenCalledWith('pb1');
    expect(contentsRepository.findById).toHaveBeenCalledWith('ct1');
    expect(campaignsRepository.findById).toHaveBeenCalledWith('c1');
    expect(projectsRepository.findById).toHaveBeenCalledWith('p1');
  });

  it('lança NotFoundException (não ForbiddenException) quando outro USER (não dono) tenta acessar', async () => {
    publicationsRepository.findById.mockResolvedValue(fakePublication);
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'outro-usuario', email: 'bob@example.com', role: Role.USER },
      { campaignId: 'c1', contentId: 'ct1', id: 'pb1' },
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('permite acesso quando o usuário é ADMIN, mesmo sem ser o dono do projeto', async () => {
    publicationsRepository.findById.mockResolvedValue(fakePublication);
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'outro-usuario', email: 'admin@example.com', role: Role.ADMIN },
      { campaignId: 'c1', contentId: 'ct1', id: 'pb1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('permite acesso quando o usuário é SUPER_ADMIN, mesmo sem ser o dono do projeto', async () => {
    publicationsRepository.findById.mockResolvedValue(fakePublication);
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      {
        sub: 'outro-usuario',
        email: 'super@example.com',
        role: Role.SUPER_ADMIN,
      },
      { campaignId: 'c1', contentId: 'ct1', id: 'pb1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('busca o Project exclusivamente por campaign.projectId, nunca por um parâmetro de rota', async () => {
    const campaignComOutroProjeto: Campaign = {
      ...fakeCampaign,
      projectId: 'p-outro',
    };
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(campaignComOutroProjeto);
    projectsRepository.findById.mockResolvedValue({
      ...fakeProject,
      id: 'p-outro',
    });
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', contentId: 'ct1' },
    );

    await guard.canActivate(context);

    expect(projectsRepository.findById).toHaveBeenCalledWith('p-outro');
    expect(projectsRepository.findById).not.toHaveBeenCalledWith('p1');
  });
});
