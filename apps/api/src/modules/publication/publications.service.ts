import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicationsRepository } from './repositories/publications.repository';
import {
  Publication,
  PublicationChannel,
  PublicationStatus,
} from '../../../generated/prisma/client';

/**
 * Mesmo shape de `PaginatedResult<T>` já usado em `ContentsService`/
 * `CampaignsService`/`ProjectsService`. Definido localmente — mesmo
 * critério de isolamento entre módulos.
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
 * Regras de negócio do lifecycle de `Publication` (SPR-014, Bloco B). Não
 * conhece DTOs HTTP nem faz verificação de propriedade — `Publication` não
 * possui `ownerId` próprio, e a propriedade é sempre derivada via
 * `Publication.contentId → Content.campaignId → Campaign.projectId →
 * Project.ownerId` (ADR-013). Essa responsabilidade é exclusiva do
 * `PublicationOwnershipGuard` (Bloco C), que roda antes do Controller
 * chamar este Service — mesmo princípio de separação já estabelecido em
 * `ContentsService`/`ContentOwnershipGuard` (ADR-012) e
 * `CampaignsService`/`CampaignOwnershipGuard` (ADR-011).
 *
 * Nunca acessa o Prisma diretamente — apenas via `PublicationsRepository`.
 *
 * Único lifecycle suportado nesta sprint: `DRAFT ⇄ SCHEDULED`. Não existem
 * `PUBLISHED`/`FAILED`/`RETRYING` — dependem de execução real, fora de
 * escopo da SPR-014 (ver `ADR-013`, `SPR-014-publication-domain.md`).
 */
@Injectable()
export class PublicationsService {
  constructor(
    private readonly publicationsRepository: PublicationsRepository,
  ) {}

  /**
   * Cria sempre `DRAFT` com `scheduledAt = null` — não existe criação
   * direta em `SCHEDULED` nesta sprint, e `DRAFT` com `scheduledAt`
   * preenchido é um estado de domínio inválido que este método nunca deve
   * produzir. Por isso o contrato nem aceita `scheduledAt`: não há, na
   * operação de criação, nenhum significado válido para esse campo.
   * Agendar é uma operação explícita (`schedule`), não um efeito colateral
   * de `create` — mesmo critério de
   * `ContentsService.create()`/`CampaignsService.create()`, que também não
   * aceitam `status` na criação.
   */
  create(
    contentId: string,
    data: { channel: PublicationChannel },
  ): Promise<Publication> {
    return this.publicationsRepository.create({
      contentId,
      channel: data.channel,
    });
  }

  /**
   * Busca uma publication pelo id ou lança `404`. Diferente de
   * `PublicationsRepository.findById`, que retorna `null` — este método já
   * aplica a regra de negócio "publication inexistente é um erro" para quem
   * o chama (reaproveitado por `schedule`/`unschedule`), mesmo padrão de
   * `ContentsService.findById`/`CampaignsService.findById`.
   */
  async findById(id: string): Promise<Publication> {
    const publication = await this.publicationsRepository.findById(id);

    if (!publication) {
      throw new NotFoundException('Publication não encontrada.');
    }

    return publication;
  }

  /**
   * `DRAFT → SCHEDULED`. Não idempotente por design (mesmo padrão de
   * `ContentsService.archive()`/`CampaignsService.archive()`): agendar uma
   * publication que já está `SCHEDULED` é `409`, não um sucesso silencioso
   * — para reagendar, primeiro desagende (`unschedule`).
   *
   * `scheduledAt` é obrigatório e deve representar um instante estritamente
   * futuro em relação ao momento da chamada (`new Date()`, mesmo padrão já
   * usado em `auth.service.ts` para comparação de expiração — não existe
   * abstração de relógio no projeto).
   */
  async schedule(id: string, scheduledAt?: Date): Promise<Publication> {
    const publication = await this.findById(id);

    if (publication.status === PublicationStatus.SCHEDULED) {
      throw new ConflictException('Publication já está agendada.');
    }

    if (!scheduledAt) {
      throw new BadRequestException(
        'scheduledAt é obrigatório para agendar uma publication.',
      );
    }

    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'scheduledAt deve representar uma data/hora futura.',
      );
    }

    return this.publicationsRepository.update(id, {
      status: PublicationStatus.SCHEDULED,
      scheduledAt,
    });
  }

  /**
   * `SCHEDULED → DRAFT`. Não idempotente por design, mesmo critério de
   * `schedule()`: desagendar uma publication que já está `DRAFT` é `409`.
   * `scheduledAt` é sempre limpo (`null`) nesta transição.
   */
  async unschedule(id: string): Promise<Publication> {
    const publication = await this.findById(id);

    if (publication.status === PublicationStatus.DRAFT) {
      throw new ConflictException('Publication já está em rascunho.');
    }

    return this.publicationsRepository.update(id, {
      status: PublicationStatus.DRAFT,
      scheduledAt: null,
    });
  }

  /**
   * Lista publications de um content, paginadas e opcionalmente filtradas
   * por status. Diferente de `ContentsService.list` (que filtra `ACTIVE`
   * por padrão), `status` omitido aqui não filtra nada — `Publication` não
   * tem um estado "arquivado" para ocultar por padrão, então as duas únicas
   * possibilidades (`DRAFT`/`SCHEDULED`) aparecem juntas quando nenhum
   * filtro é informado.
   *
   * Adicionado no Bloco C (Controller precisa, Repository já oferecia
   * `findManyByContent` desde o Bloco A) — nenhum método já aprovado do
   * Bloco B foi alterado.
   */
  async list(
    contentId: string,
    params: { page: number; limit: number; status?: PublicationStatus },
  ): Promise<PaginatedResult<Publication>> {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const { items, total } =
      await this.publicationsRepository.findManyByContent({
        contentId,
        status,
        skip,
        take: limit,
      });

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
