import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { ContentOwnershipGuard } from './content-ownership.guard';
import { ContentsRepository } from '../repositories/contents.repository';
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
  Role,
} from '../../../../generated/prisma/client';

describe('ContentOwnershipGuard', () => {
  let guard: ContentOwnershipGuard;
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

  function createContext(
    user: JwtPayload,
    params: { campaignId: string; id?: string },
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    contentsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ContentsRepository>;

    campaignsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CampaignsRepository>;

    projectsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ProjectsRepository>;

    guard = new ContentOwnershipGuard(
      contentsRepository,
      campaignsRepository,
      projectsRepository,
    );
  });

  afterEach(() => jest.clearAllMocks());

  // Caso 1 — Content inexistente
  it('lança NotFoundException quando o conteúdo não existe', async () => {
    contentsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', id: 'ct-inexistente' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(contentsRepository.findById).toHaveBeenCalledWith('ct-inexistente');
    // Não deve prosseguir para buscar Campaign/Project se o Content já
    // falhou.
    expect(campaignsRepository.findById).not.toHaveBeenCalled();
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  // Caso 2 — Content existe mas campaignId da URL não corresponde (IDOR)
  it('lança NotFoundException quando o conteúdo pertence a outra campanha (inconsistência de campaignId)', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent); // campaignId: 'c1'
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c2', id: 'ct1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    // A inconsistência é detectada antes de qualquer busca de
    // Campaign/Project — protege contra IDOR sem revelar se 'c2' existe.
    expect(campaignsRepository.findById).not.toHaveBeenCalled();
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  // Caso 3 — Campaign inexistente
  it('lança NotFoundException quando a campanha não existe', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', id: 'ct1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando a campanha não existe em rota sem :id', async () => {
    campaignsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'qualquer-usuario', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c-inexistente' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(contentsRepository.findById).not.toHaveBeenCalled();
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  // Caso 4 — Project inexistente (Content/Campaign consistentes)
  it('lança NotFoundException quando o projeto associado não existe', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', id: 'ct1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(projectsRepository.findById).toHaveBeenCalledWith('p1');
  });

  // Caso 5 — Project pertence ao usuário → autorizado
  it('permite acesso quando o conteúdo pertence à campanha informada e o usuário é dono do projeto', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', id: 'ct1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(contentsRepository.findById).toHaveBeenCalledWith('ct1');
    expect(campaignsRepository.findById).toHaveBeenCalledWith('c1');
    expect(projectsRepository.findById).toHaveBeenCalledWith('p1');
  });

  // Caso 6 — Project pertence a outro usuário (nunca 403)
  it('lança NotFoundException (não ForbiddenException) quando outro USER (não dono) tenta acessar', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'outro-usuario', email: 'bob@example.com', role: Role.USER },
      { campaignId: 'c1', id: 'ct1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  // Caso 7 — ADMIN → autorizado
  it('permite acesso quando o usuário é ADMIN, mesmo sem ser o dono do projeto', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'outro-usuario', email: 'admin@example.com', role: Role.ADMIN },
      { campaignId: 'c1', id: 'ct1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  // Caso 8 — SUPER_ADMIN → autorizado
  it('permite acesso quando o usuário é SUPER_ADMIN, mesmo sem ser o dono do projeto', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      {
        sub: 'outro-usuario',
        email: 'super@example.com',
        role: Role.SUPER_ADMIN,
      },
      { campaignId: 'c1', id: 'ct1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  // Caso 9 — rota só com :campaignId (create/list): resolução começa pela
  // Campaign, Content nunca é consultado.
  it('permite acesso em rota sem :id (create/list) quando o usuário é dono do projeto, sem consultar Content', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(contentsRepository.findById).not.toHaveBeenCalled();
    expect(campaignsRepository.findById).toHaveBeenCalledWith('c1');
    expect(projectsRepository.findById).toHaveBeenCalledWith('p1');
  });

  // Caso 10 — ownership deve usar campaign.projectId (nunca um parâmetro
  // de Project inexistente na rota, já que Content nunca expõe
  // :projectId na URL).
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
      { campaignId: 'c1', id: 'ct1' },
    );

    await guard.canActivate(context);

    expect(projectsRepository.findById).toHaveBeenCalledWith('p-outro');
    expect(projectsRepository.findById).not.toHaveBeenCalledWith('p1');
  });

  it('garante explicitamente que o guard nunca lança ForbiddenException, mesmo em qualquer cenário de falha', async () => {
    // Content inexistente
    contentsRepository.findById.mockResolvedValue(null);
    const contextContentNotFound = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', id: 'ct-x' },
    );
    await expect(
      guard.canActivate(contextContentNotFound),
    ).rejects.toBeInstanceOf(NotFoundException);

    // Não-dono, não-admin
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const contextNotOwner = createContext(
      { sub: 'outro-usuario', email: 'bob@example.com', role: Role.USER },
      { campaignId: 'c1', id: 'ct1' },
    );
    await expect(guard.canActivate(contextNotOwner)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Caso 11 — usa request.user.sub / request.user.role diretamente, sem
  // reimplementar autenticação, mesmo padrão de CampaignOwnershipGuard.
  it('usa request.user.sub e request.user.role diretamente, sem reimplementar autenticação', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const user: JwtPayload = {
      sub: 'owner-1',
      email: 'ana@example.com',
      role: Role.USER,
    };
    const context = createContext(user, { campaignId: 'c1', id: 'ct1' });

    await guard.canActivate(context);

    expect(contentsRepository.findById).toHaveBeenCalledTimes(1);
    expect(campaignsRepository.findById).toHaveBeenCalledTimes(1);
    expect(projectsRepository.findById).toHaveBeenCalledTimes(1);
  });

  it('busca o conteúdo pelo id do path, não por um id fixo', async () => {
    contentsRepository.findById.mockResolvedValue(fakeContent);
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { campaignId: 'c1', id: 'outro-id' },
    );

    await guard.canActivate(context);

    expect(contentsRepository.findById).toHaveBeenCalledWith('outro-id');
  });
});
