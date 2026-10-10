import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicationsRepository } from '../repositories/publications.repository';
import { ContentsRepository } from '../../content/repositories/contents.repository';
import { CampaignsRepository } from '../../campaigns/repositories/campaigns.repository';
import { ProjectsRepository } from '../../projects/repositories/projects.repository';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { Role } from '../../../../generated/prisma/client';

interface RequestWithUserAndParams {
  user: JwtPayload;
  params: { campaignId: string; contentId: string; id?: string };
}

/**
 * Autorização por propriedade de recurso para Publication (ADR-013).
 * Aplicado explicitamente via `@UseGuards(PublicationOwnershipGuard)` nas
 * rotas aninhadas sob
 * `/v1/campaigns/:campaignId/contents/:contentId/publications`.
 *
 * `Publication` não possui `ownerId` próprio — o dono é sempre derivado
 * pela cadeia `Publication.contentId → Content.campaignId →
 * Campaign.projectId → Project.ownerId` (ADR-013, "quatro saltos até
 * Project"). Nem a rota de Publication expõe `:projectId`.
 *
 * **Diferença real em relação a `ContentOwnershipGuard`:** lá, `Content`
 * só é resolvido quando `:id` está presente (`create`/`list` não têm
 * Content específico para validar). Aqui, `:contentId` está **sempre**
 * presente na rota — inclusive em `create`/`list` de Publication — então
 * `Content` é resolvido e validado incondicionalmente, não só quando `:id`
 * (publicationId) existe. `:id`, quando presente, adiciona um salto extra
 * *antes* disso: a própria Publication é resolvida e validada contra
 * `:contentId`.
 *
 * Nunca lança `ForbiddenException` — toda falha de ownership (Publication
 * inexistente, Publication de outro Content, Content inexistente, Content
 * de outra Campaign, Campaign inexistente, Project inexistente, Project de
 * outro dono) resulta em `404 Not Found` (mesmo critério de ADR-009/
 * ADR-011/ADR-012). Guard module-specific, sem classe base ou abstração
 * compartilhada com os três guards anteriores — decisão reavaliada e
 * deliberadamente adiada pela quarta vez (ADR-013, seção 3).
 *
 * Busca via `PublicationsRepository`/`ContentsRepository`/
 * `CampaignsRepository`/`ProjectsRepository` — nunca acessa o Prisma
 * diretamente.
 */
@Injectable()
export class PublicationOwnershipGuard implements CanActivate {
  constructor(
    private readonly publicationsRepository: PublicationsRepository,
    private readonly contentsRepository: ContentsRepository,
    private readonly campaignsRepository: CampaignsRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithUserAndParams>();
    const { user, params } = request;

    // Rotas com :id (GET/PATCH de uma publication específica): a
    // Publication precisa ser resolvida e validada contra :contentId
    // antes de qualquer outra consulta — protege contra combinar um
    // :contentId próprio com o :id de uma publication de outro content.
    if (params.id) {
      const publication = await this.publicationsRepository.findById(params.id);

      if (!publication) {
        throw new NotFoundException('Publication não encontrada.');
      }

      if (publication.contentId !== params.contentId) {
        throw new NotFoundException('Publication não encontrada.');
      }
    }

    // :contentId está sempre presente na rota de Publication (diferente
    // de Content sob Campaign) — Content é resolvido e validado
    // incondicionalmente, inclusive em create/list.
    const content = await this.contentsRepository.findById(params.contentId);

    if (!content) {
      throw new NotFoundException('Publication não encontrada.');
    }

    if (content.campaignId !== params.campaignId) {
      throw new NotFoundException('Publication não encontrada.');
    }

    const campaign = await this.campaignsRepository.findById(params.campaignId);

    if (!campaign) {
      throw new NotFoundException('Publication não encontrada.');
    }

    const project = await this.projectsRepository.findById(campaign.projectId);

    // 404, nunca 403, para qualquer falha de ownership (mesmo critério já
    // usado pelos três guards anteriores): não revela a um usuário
    // não-dono que o projeto, a campanha, o conteúdo ou a publication
    // existem.
    if (!project) {
      throw new NotFoundException('Publication não encontrada.');
    }

    const isOwner = project.ownerId === user.sub;
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new NotFoundException('Publication não encontrada.');
    }

    return true;
  }
}
