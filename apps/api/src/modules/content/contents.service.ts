import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentsRepository } from './repositories/contents.repository';
import { Content, ContentStatus } from '../../../generated/prisma/client';

/**
 * Mesmo shape de `PaginatedResult<T>` já usado em `ProjectsService`/
 * `CampaignsService`. Definido localmente, não importado de `projects/`
 * nem de `campaigns/`, para manter o módulo `content` autocontido — mesmo
 * critério de isolamento entre módulos já aplicado a `CampaignsService`.
 */
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Regras de negócio do agregado `Content` (SPR-013, Bloco B). Não conhece
 * DTOs HTTP nem faz verificação de propriedade — `Content` não possui
 * `ownerId` próprio, e a propriedade é sempre derivada via
 * `Content.campaignId → Campaign.projectId → Project.ownerId` (ADR-012).
 * Essa responsabilidade é exclusiva do `ContentOwnershipGuard`, que roda
 * antes do Controller (Bloco C) chamar este Service. Este Service confia
 * que, quando chamado, a autorização já foi resolvida — mesmo princípio de
 * separação já estabelecido em `ProjectsService`/`ProjectOwnershipGuard`
 * (ADR-009) e em `CampaignsService`/`CampaignOwnershipGuard` (ADR-011).
 *
 * Nunca acessa o Prisma diretamente — apenas via `ContentsRepository`.
 */
@Injectable()
export class ContentsService {
  constructor(private readonly contentsRepository: ContentsRepository) {}

  /**
   * `campaignId` vem da rota (`:campaignId`), já validado pelo
   * `ContentOwnershipGuard` antes deste método ser chamado — por isso é
   * um parâmetro explícito, não parte de `data`, mesmo padrão de
   * `projectId` em `CampaignsService.create`.
   */
  create(
    campaignId: string,
    data: { name: string; body?: string },
  ): Promise<Content> {
    return this.contentsRepository.create({
      campaignId,
      name: data.name,
      body: data.body,
    });
  }

  /**
   * Busca um conteúdo pelo id ou lança `404`. Diferente de
   * `ContentsRepository.findById`, que retorna `null` — este método já
   * aplica a regra de negócio "conteúdo inexistente é um erro" para quem o
   * chama (reaproveitado por `update`/`archive`), mesmo padrão de
   * `CampaignsService.findById`.
   */
  async findById(id: string): Promise<Content> {
    const content = await this.contentsRepository.findById(id);

    if (!content) {
      throw new NotFoundException('Conteúdo não encontrado.');
    }

    return content;
  }

  /**
   * Atualização parcial de `name`/`body`.
   *
   * A regra "pelo menos um campo deve ser enviado" é validada aqui, não em
   * DTO (nenhum DTO existe nesta sprint — Bloco C), mesmo padrão de
   * `CampaignsService.update`.
   */
  async update(
    id: string,
    data: { name?: string; body?: string },
  ): Promise<Content> {
    if (data.name === undefined && data.body === undefined) {
      throw new BadRequestException(
        'Pelo menos um campo (name ou body) deve ser informado.',
      );
    }

    await this.findById(id);

    return this.contentsRepository.update(id, data);
  }

  /**
   * `ACTIVE` → `ARCHIVED`. Não idempotente por design (mesmo padrão de
   * `CampaignsService.archive`): arquivar um conteúdo já arquivado é
   * `409`, não um sucesso silencioso. `ARCHIVED` é terminal nesta sprint —
   * sem operação de `restore` (ADR-012, fora de escopo do SPR-013).
   */
  async archive(id: string): Promise<Content> {
    const content = await this.findById(id);

    if (content.status === ContentStatus.ARCHIVED) {
      throw new ConflictException('Conteúdo já está arquivado.');
    }

    return this.contentsRepository.updateStatus(id, ContentStatus.ARCHIVED);
  }

  /**
   * Lista conteúdos de uma campanha, paginados e filtrados por status.
   *
   * Traduz a semântica de API (`status` omitido → filtra `ACTIVE` por
   * padrão; `status: 'ALL'` → sem filtro) para o contrato primitivo do
   * `ContentsRepository` (`status` ausente = sem filtro), mesma tradução já
   * feita em `CampaignsService.list`.
   */
  async list(
    campaignId: string,
    params: { page: number; limit: number; status?: ContentStatus | 'ALL' },
  ): Promise<PaginatedResult<Content>> {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;
    const resolvedStatus =
      status === 'ALL' ? undefined : (status ?? ContentStatus.ACTIVE);

    const { items, total } = await this.contentsRepository.findManyByCampaign({
      campaignId,
      status: resolvedStatus,
      skip,
      take: limit,
    });

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
