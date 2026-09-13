import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Content, ContentStatus } from '../../../../generated/prisma/client';

/**
 * Repository Pattern (ARCHITECTURE.md) — isola a camada de negócio do
 * Prisma diretamente, mesmo padrão de `ProjectsRepository`/
 * `CampaignsRepository`.
 *
 * Recebe apenas parâmetros primitivos ({ campaignId, status, skip, take }),
 * nunca DTOs HTTP — a camada de persistência não conhece a forma da
 * requisição HTTP (SPR-013-content-domain.md, Bloco A). Isso permite
 * implementar e testar este repository antes de `ListContentsQueryDto`/
 * `ContentOwnershipGuard` existirem (Blocos B/C).
 *
 * Sem autorização, sem verificação de usuário autenticado ou papel — essa
 * responsabilidade pertence exclusivamente a `ContentOwnershipGuard`
 * (Bloco B, ver ADR-012). Este repository apenas encapsula acesso ao
 * Prisma para o agregado `Content`.
 */
@Injectable()
export class ContentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Content | null> {
    return this.prisma.content.findUnique({ where: { id } });
  }

  /**
   * Lista conteúdos de uma campanha, paginados e opcionalmente filtrados
   * por status. A tradução de valores vindos da API (ex.: `?status=ALL`
   * para "sem filtro", ou o default `ACTIVE` quando omitido) é
   * responsabilidade de uma camada superior (Service/Controller, Bloco
   * B/C) — aqui, ausência de `status` significa, literalmente, nenhum
   * filtro de status aplicado.
   */
  async findManyByCampaign(params: {
    campaignId: string;
    status?: ContentStatus;
    skip: number;
    take: number;
  }): Promise<{ items: Content[]; total: number }> {
    const { campaignId, status, skip, take } = params;
    const where = { campaignId, ...(status ? { status } : {}) };

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.content.count({ where }),
    ]);

    return { items, total };
  }

  create(data: {
    campaignId: string;
    name: string;
    body?: string;
  }): Promise<Content> {
    return this.prisma.content.create({ data });
  }

  update(id: string, data: { name?: string; body?: string }): Promise<Content> {
    return this.prisma.content.update({ where: { id }, data });
  }

  updateStatus(id: string, status: ContentStatus): Promise<Content> {
    return this.prisma.content.update({ where: { id }, data: { status } });
  }
}
