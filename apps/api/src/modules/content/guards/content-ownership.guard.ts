import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentsRepository } from '../repositories/contents.repository';
import { CampaignsRepository } from '../../campaigns/repositories/campaigns.repository';
import { ProjectsRepository } from '../../projects/repositories/projects.repository';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { Role } from '../../../../generated/prisma/client';

interface RequestWithUserAndParams {
  user: JwtPayload;
  params: { campaignId: string; id?: string };
}

/**
 * Autorização por propriedade de recurso para Content (ADR-012). Não é
 * global — precisa ser aplicado explicitamente via
 * `@UseGuards(ContentOwnershipGuard)` nas rotas aninhadas sob
 * `/v1/campaigns/:campaignId/contents`.
 *
 * `Content` não possui `ownerId` próprio — o dono é sempre derivado pela
 * cadeia `Content.campaignId → Campaign.projectId → Project.ownerId`
 * (ADR-012). Diferente de `CampaignOwnershipGuard`, a rota de Content não
 * expõe `:projectId` na URL — por isso o `projectId` usado para buscar o
 * Project é *sempre* o valor persistido em `campaign.projectId`, nunca um
 * parâmetro HTTP.
 *
 * Quando a rota carrega tanto `:campaignId` quanto `:id` (conteúdo
 * específico), o Content é resolvido e validado contra `:campaignId`
 * *antes* de qualquer outra consulta, para impedir IDOR (um `campaignId`
 * próprio combinado com o `id` de um conteúdo de outra Campaign).
 *
 * Assim como `CampaignOwnershipGuard`, este guard nunca lança
 * `ForbiddenException` — toda falha de ownership (Content inexistente,
 * Content de outra Campaign, Campaign inexistente, Project inexistente,
 * Project de outro dono) resulta em `404 Not Found` (ADR-012, mesma
 * divergência consciente de ADR-009 já aplicada por `CampaignOwnershipGuard`
 * via ADR-011). Este guard é module-specific, sem classe base ou abstração
 * compartilhada com `ProjectOwnershipGuard`/`CampaignOwnershipGuard`
 * (decisão fechada na ADR-012).
 *
 * Busca via `ContentsRepository`/`CampaignsRepository`/`ProjectsRepository`
 * — nunca acessa o Prisma diretamente, mesmo padrão de separação já usado
 * no restante do projeto.
 */
@Injectable()
export class ContentOwnershipGuard implements CanActivate {
  constructor(
    private readonly contentsRepository: ContentsRepository,
    private readonly campaignsRepository: CampaignsRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithUserAndParams>();
    const { user, params } = request;

    // Rotas com :id (GET/PATCH/archive de um conteúdo específico): o
    // Content precisa ser resolvido e validado contra :campaignId antes
    // de qualquer outra consulta (ADR-012, seção "Segurança") — protege
    // contra combinar um :campaignId próprio com o :id de um conteúdo
    // pertencente a outra campanha.
    if (params.id) {
      const content = await this.contentsRepository.findById(params.id);

      if (!content) {
        throw new NotFoundException('Conteúdo não encontrado.');
      }

      if (content.campaignId !== params.campaignId) {
        throw new NotFoundException('Conteúdo não encontrado.');
      }
    }

    // Rotas só com :campaignId (create/list): não existe Content
    // específico para validar — a resolução começa diretamente pela
    // Campaign (ADR-012, seção 7).
    const campaign = await this.campaignsRepository.findById(params.campaignId);

    if (!campaign) {
      throw new NotFoundException('Conteúdo não encontrado.');
    }

    // O projectId usado para buscar o Project vem exclusivamente de
    // campaign.projectId (valor persistido) — nunca de um parâmetro de
    // URL, já que a rota de Content não expõe :projectId (ADR-012).
    const project = await this.projectsRepository.findById(campaign.projectId);

    // 404, nunca 403, para qualquer falha de ownership de Content
    // (ADR-012 — mesma divergência consciente de ADR-009 já aplicada por
    // CampaignOwnershipGuard): não revela a um usuário não-dono que o
    // projeto ou o conteúdo existem.
    if (!project) {
      throw new NotFoundException('Conteúdo não encontrado.');
    }

    const isOwner = project.ownerId === user.sub;
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new NotFoundException('Conteúdo não encontrado.');
    }

    return true;
  }
}
