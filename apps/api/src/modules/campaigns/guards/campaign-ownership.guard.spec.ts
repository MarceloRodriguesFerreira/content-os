import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { CampaignOwnershipGuard } from './campaign-ownership.guard';
import { CampaignsRepository } from '../repositories/campaigns.repository';
import { ProjectsRepository } from '../../projects/repositories/projects.repository';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import {
  Campaign,
  CampaignStatus,
  Project,
  ProjectStatus,
  Role,
} from '../../../../generated/prisma/client';

describe('CampaignOwnershipGuard', () => {
  let guard: CampaignOwnershipGuard;
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

  function createContext(
    user: JwtPayload,
    params: { projectId: string; id?: string },
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    campaignsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CampaignsRepository>;

    projectsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ProjectsRepository>;

    guard = new CampaignOwnershipGuard(campaignsRepository, projectsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  // Caso 1 — Campaign inexistente
  it('lança NotFoundException quando a campanha não existe', async () => {
    campaignsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { projectId: 'p1', id: 'c-inexistente' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(campaignsRepository.findById).toHaveBeenCalledWith('c-inexistente');
    // Não deve prosseguir para buscar o Project se a Campaign já falhou.
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  // Caso 2 — Campaign existente, pertence ao Project informado, usuário é
  // owner do Project
  it('permite acesso quando a campanha pertence ao projectId informado e o usuário é dono do projeto', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { projectId: 'p1', id: 'c1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(campaignsRepository.findById).toHaveBeenCalledWith('c1');
    expect(projectsRepository.findById).toHaveBeenCalledWith('p1');
  });

  it('permite acesso quando o usuário é ADMIN, mesmo sem ser o dono do projeto', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'outro-usuario', email: 'admin@example.com', role: Role.ADMIN },
      { projectId: 'p1', id: 'c1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('permite acesso quando o usuário é SUPER_ADMIN, mesmo sem ser o dono do projeto', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      {
        sub: 'outro-usuario',
        email: 'super@example.com',
        role: Role.SUPER_ADMIN,
      },
      { projectId: 'p1', id: 'c1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('permite acesso em rota sem :id (create/list) quando o usuário é dono do projeto', async () => {
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { projectId: 'p1' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    // Sem :id, a Campaign nunca deve ser consultada.
    expect(campaignsRepository.findById).not.toHaveBeenCalled();
    expect(projectsRepository.findById).toHaveBeenCalledWith('p1');
  });

  // Caso 3 — Campaign pertence a outro Project
  it('lança NotFoundException quando a campanha pertence a outro projeto (inconsistência de projectId)', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign); // projectId: 'p1'
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { projectId: 'p2', id: 'c1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    // A inconsistência é detectada antes de qualquer busca de Project —
    // protege contra IDOR sem revelar se 'p2' existe.
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  // Caso 4 — Project inexistente (Campaign existe e é consistente)
  it('lança NotFoundException quando o projeto associado não existe', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { projectId: 'p1', id: 'c1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('lança NotFoundException quando o projeto não existe em rota sem :id', async () => {
    projectsRepository.findById.mockResolvedValue(null);
    const context = createContext(
      { sub: 'qualquer-usuario', email: 'ana@example.com', role: Role.USER },
      { projectId: 'p-inexistente' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  // Caso 5 — Project pertence a outro usuário (nunca 403)
  it('lança NotFoundException (não ForbiddenException) quando outro USER (não dono) tenta acessar', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'outro-usuario', email: 'bob@example.com', role: Role.USER },
      { projectId: 'p1', id: 'c1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('garante explicitamente que o guard nunca lança ForbiddenException, mesmo em qualquer cenário de falha', async () => {
    // Campaign inexistente
    campaignsRepository.findById.mockResolvedValue(null);
    const contextCampaignNotFound = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { projectId: 'p1', id: 'c-x' },
    );
    await expect(
      guard.canActivate(contextCampaignNotFound),
    ).rejects.toBeInstanceOf(NotFoundException);

    // Não-dono, não-admin
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const contextNotOwner = createContext(
      { sub: 'outro-usuario', email: 'bob@example.com', role: Role.USER },
      { projectId: 'p1', id: 'c1' },
    );
    await expect(guard.canActivate(contextNotOwner)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Caso 6 — usuário autenticado é o produzido pelo mecanismo de
  // autenticação já existente (request.user, populado pelo JwtAuthGuard
  // global) — o guard não decodifica token nem duplica lógica de JWT, só
  // lê request.user.sub / request.user.role, mesmo padrão de
  // ProjectOwnershipGuard.
  it('usa request.user.sub e request.user.role diretamente, sem reimplementar autenticação', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const user: JwtPayload = {
      sub: 'owner-1',
      email: 'ana@example.com',
      role: Role.USER,
    };
    const context = createContext(user, { projectId: 'p1', id: 'c1' });

    await guard.canActivate(context);

    // O guard não chama nenhum serviço de auth/JWT — apenas usa o user já
    // presente na request (populado por JwtAuthGuard, ADR-002).
    expect(campaignsRepository.findById).toHaveBeenCalledTimes(1);
    expect(projectsRepository.findById).toHaveBeenCalledTimes(1);
  });

  // Caso 7 — validação de consistência acontece antes da checagem de
  // ownership do Project (ordem obrigatória do ADR-011, seção 3)
  it('valida a consistência projectId da campanha antes de consultar o Project (ordem: Campaign → consistência → Project → ownership)', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign); // projectId: 'p1'
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { projectId: 'p-diferente', id: 'c1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(campaignsRepository.findById).toHaveBeenCalled();
    expect(projectsRepository.findById).not.toHaveBeenCalled();
  });

  it('busca a campanha pelo id do path, não por um id fixo', async () => {
    campaignsRepository.findById.mockResolvedValue(fakeCampaign);
    projectsRepository.findById.mockResolvedValue(fakeProject);
    const context = createContext(
      { sub: 'owner-1', email: 'ana@example.com', role: Role.USER },
      { projectId: 'p1', id: 'outro-id' },
    );

    await guard.canActivate(context);

    expect(campaignsRepository.findById).toHaveBeenCalledWith('outro-id');
  });
});
