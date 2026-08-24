import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignsRepository } from './repositories/campaigns.repository';
import { Campaign, CampaignStatus } from '../../../generated/prisma/client';

/**
 * Mesmo shape de `PaginatedResult<T>` já usado em `ProjectsService`.
 * Definido localmente, não importado de `projects/`, para manter o módulo
 * `campaigns` autocontido — mesmo critério de isolamento já aplicado ao
 * duplicar `CampaignsRepository` a partir de `ProjectsRepository` no
 * Bloco A, em vez de compartilhar uma abstração entre os dois módulos.
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
 * Regras de negócio do agregado `Campaign` (SPR-012). Não conhece DTOs HTTP
 * nem faz verificação de propriedade — `Campaign` não possui `ownerId`
 * próprio, e mesmo que possuísse, essa responsabilidade é do
 * `CampaignOwnershipGuard` (ADR-011), que roda antes do Controller
 * (Bloco C) chamar este Service. Este Service confia que, quando chamado,
 * a autorização já foi resolvida — mesmo princípio de separação já
 * estabelecido em `ProjectsService`/`ProjectOwnershipGuard` (ADR-009).
 */
@Injectable()
export class CampaignsService {
  constructor(private readonly campaignsRepository: CampaignsRepository) {}

  /**
   * `projectId` vem da rota (`:projectId`), já validado pelo
   * `CampaignOwnershipGuard` antes deste método ser chamado — por isso é
   * um parâmetro explícito, não parte de `data`, mesmo padrão de `ownerId`
   * em `ProjectsService.create`.
   */
  create(
    projectId: string,
    data: { name: string; description?: string },
  ): Promise<Campaign> {
    return this.campaignsRepository.create({
      projectId,
      name: data.name,
      description: data.description,
    });
  }

  /**
   * Busca uma campanha pelo id ou lança `404`. Diferente de
   * `CampaignsRepository.findById`, que retorna `null` — este método já
   * aplica a regra de negócio "campanha inexistente é um erro" para quem o
   * chama (reaproveitado por `update`/`archive`).
   */
  async findById(id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findById(id);

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    return campaign;
  }

  /**
   * Atualização parcial de `name`/`description`.
   *
   * A regra "pelo menos um campo deve ser enviado" é validada aqui, não em
   * DTO (nenhum DTO existe nesta sprint — Bloco C), mesmo padrão de
   * `ProjectsService.update`.
   */
  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Campaign> {
    if (data.name === undefined && data.description === undefined) {
      throw new BadRequestException(
        'Pelo menos um campo (name ou description) deve ser informado.',
      );
    }

    await this.findById(id);

    return this.campaignsRepository.update(id, data);
  }

  /**
   * `ACTIVE` → `ARCHIVED`. Não idempotente por design (mesmo padrão de
   * `ProjectsService.archive`): arquivar uma campanha já arquivada é
   * `409`, não um sucesso silencioso. Diferente de `Project`, `Campaign`
   * não tem operação de `restore` nesta sprint (fora de escopo do
   * SPR-012).
   */
  async archive(id: string): Promise<Campaign> {
    const campaign = await this.findById(id);

    if (campaign.status === CampaignStatus.ARCHIVED) {
      throw new ConflictException('Campanha já está arquivada.');
    }

    return this.campaignsRepository.updateStatus(id, CampaignStatus.ARCHIVED);
  }

  /**
   * Lista campanhas de um projeto, paginada e filtrada por status.
   *
   * Traduz a semântica de API (`status` omitido → filtra `ACTIVE` por
   * padrão; `status: 'ALL'` → sem filtro) para o contrato primitivo do
   * `CampaignsRepository` (`status` ausente = sem filtro), mesma tradução
   * já feita em `ProjectsService.list`.
   */
  async list(
    projectId: string,
    params: { page: number; limit: number; status?: CampaignStatus | 'ALL' },
  ): Promise<PaginatedResult<Campaign>> {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;
    const resolvedStatus =
      status === 'ALL' ? undefined : (status ?? CampaignStatus.ACTIVE);

    const { items, total } = await this.campaignsRepository.findManyByProject({
      projectId,
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
