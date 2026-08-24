import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignsRepository } from '../repositories/campaigns.repository';
import { ProjectsRepository } from '../../projects/repositories/projects.repository';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { Role } from '../../../../generated/prisma/client';

interface RequestWithUserAndParams {
  user: JwtPayload;
  params: { projectId: string; id?: string };
}

/**
 * Autorização por propriedade de recurso para Campaign (ADR-011). Não é
 * global — precisa ser aplicado explicitamente via
 * `@UseGuards(CampaignOwnershipGuard)` nas rotas aninhadas sob
 * `/v1/projects/:projectId/campaigns`.
 *
 * `Campaign` não possui `ownerId` próprio — o dono é sempre derivado do
 * `Project` pai (`campaign.projectId → project.ownerId`, ADR-011). Por
 * isso este guard não é uma cópia trivial de `ProjectOwnershipGuard`:
 * quando a rota carrega tanto `:projectId` quanto `:id` (campanha
 * específica), a Campaign é resolvida e validada contra `:projectId`
 * *antes* de qualquer verificação de ownership do Project, para impedir
 * IDOR (um `projectId` próprio combinado com o `id` de uma campanha de
 * outro projeto).
 *
 * Diferente de `ProjectOwnershipGuard`, este guard nunca lança
 * `ForbiddenException` — toda falha de ownership (Campaign inexistente,
 * Campaign de outro Project, Project inexistente, Project de outro dono)
 * resulta em `404 Not Found` (ADR-011, divergência consciente de
 * ADR-009 — este guard é intencionalmente module-specific, sem
 * abstração compartilhada com `ProjectOwnershipGuard`).
 *
 * Busca via `CampaignsRepository`/`ProjectsRepository` — nunca acessa o
 * Prisma diretamente, mesmo padrão de separação já usado no restante do
 * projeto.
 */
@Injectable()
export class CampaignOwnershipGuard implements CanActivate {
  constructor(
    private readonly campaignsRepository: CampaignsRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithUserAndParams>();
    const { user, params } = request;

    // Rotas com :id (GET/PATCH/archive de uma campanha específica): a
    // Campaign precisa ser resolvida e validada contra :projectId antes
    // de qualquer verificação de ownership (ADR-011, seção 3) — protege
    // contra combinar um :projectId próprio com o :id de uma campanha
    // pertencente a outro projeto.
    if (params.id) {
      const campaign = await this.campaignsRepository.findById(params.id);

      if (!campaign) {
        throw new NotFoundException('Campanha não encontrada.');
      }

      if (campaign.projectId !== params.projectId) {
        throw new NotFoundException('Campanha não encontrada.');
      }
    }

    const project = await this.projectsRepository.findById(params.projectId);

    // 404, nunca 403, para qualquer falha de ownership de Campaign
    // (ADR-011 — divergência consciente de ADR-009): não revela a um
    // usuário não-dono que o projeto ou a campanha existem.
    if (!project) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    const isOwner = project.ownerId === user.sub;
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    return true;
  }
}
