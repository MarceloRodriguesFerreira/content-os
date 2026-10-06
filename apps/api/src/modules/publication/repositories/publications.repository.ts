import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  Publication,
  PublicationChannel,
  PublicationStatus,
} from '../../../../generated/prisma/client';

/**
 * Repository Pattern (ARCHITECTURE.md) — isola a camada de negócio do
 * Prisma diretamente, mesmo padrão de `ProjectsRepository`/
 * `CampaignsRepository`/`ContentsRepository`.
 *
 * Recebe apenas parâmetros primitivos ({ contentId, status, skip, take }),
 * nunca DTOs HTTP — a camada de persistência não conhece a forma da
 * requisição HTTP (SPR-014-publication-domain.md, Bloco A). Isso permite
 * implementar e testar este repository antes de `CreatePublicationDto`/
 * `PublicationOwnershipGuard` existirem (Blocos B/C).
 *
 * Sem autorização, sem verificação de usuário autenticado ou papel — essa
 * responsabilidade pertence exclusivamente a `PublicationOwnershipGuard`
 * (Bloco B, ver ADR-013). Este repository apenas encapsula acesso ao
 * Prisma para o agregado `Publication`.
 *
 * Sem transições de lifecycle (DRAFT ⇄ SCHEDULED) ou validação de
 * `scheduledAt` — responsabilidade do `PublicationsService` (Bloco B, ver
 * ADR-013 e SPR-014-publication-domain.md).
 *
 * Sem método de exclusão: não há `DELETE` físico nesta sprint
 * (SPR-014-publication-domain.md, ADR-013 seção 8). O desagendamento é
 * modelado como transição de estado (`update`), nunca como remoção de
 * registro.
 */
@Injectable()
export class PublicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Publication | null> {
    return this.prisma.publication.findUnique({ where: { id } });
  }

  /**
   * Lista publications de um content, paginadas e opcionalmente filtradas
   * por status. A tradução de valores vindos da API (ex.: `?status=ALL`
   * para "sem filtro") é responsabilidade de uma camada superior
   * (Service/Controller, Bloco B/C) — aqui, ausência de `status` significa,
   * literalmente, nenhum filtro de status aplicado.
   *
   * `orderBy: { createdAt: 'desc' }` é fixo — mesmo padrão já usado por
   * `ProjectsRepository`, `CampaignsRepository` e `ContentsRepository`
   * (sem ordenação customizável). Não é uma decisão nova desta sprint; ver
   * SPR-014.md, "Fora de Escopo".
   */
  async findManyByContent(params: {
    contentId: string;
    status?: PublicationStatus;
    skip: number;
    take: number;
  }): Promise<{ items: Publication[]; total: number }> {
    const { contentId, status, skip, take } = params;
    const where = { contentId, ...(status ? { status } : {}) };

    const [items, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.publication.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * `scheduledAt` só é incluído no objeto enviado ao Prisma quando
   * efetivamente informado — evita persistir `scheduledAt: undefined`
   * (mesmo critério de construção condicional já usado no `where` de
   * `findManyByContent`). Não é regra de negócio: nenhuma validação de
   * valor (ex.: data futura) acontece aqui, responsabilidade do
   * `PublicationsService` (Bloco B).
   */
  create(data: {
    contentId: string;
    channel: PublicationChannel;
    scheduledAt?: Date;
  }): Promise<Publication> {
    const { contentId, channel, scheduledAt } = data;
    return this.prisma.publication.create({
      data: {
        contentId,
        channel,
        ...(scheduledAt !== undefined ? { scheduledAt } : {}),
      },
    });
  }

  /**
   * Atualização genérica dos campos persistíveis. Transições de lifecycle
   * (validação de `scheduledAt` obrigatório/futuro em `SCHEDULED`, limpeza
   * de `scheduledAt` ao voltar para `DRAFT`) são regra de negócio do
   * `PublicationsService` (Bloco B) — este método apenas persiste o que
   * for passado, incluindo `scheduledAt: null` para limpar o agendamento.
   */
  update(
    id: string,
    data: {
      channel?: PublicationChannel;
      status?: PublicationStatus;
      scheduledAt?: Date | null;
    },
  ): Promise<Publication> {
    return this.prisma.publication.update({ where: { id }, data });
  }
}
