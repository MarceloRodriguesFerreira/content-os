import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Campaign, CampaignStatus } from '../../../../generated/prisma/client';

/**
 * Repository Pattern (ARCHITECTURE.md) — isola a camada de negócio do
 * Prisma diretamente, mesmo padrão de `ProjectsRepository`.
 *
 * Recebe apenas parâmetros primitivos ({ projectId, status, skip, take }),
 * nunca DTOs HTTP — a camada de persistência não conhece a forma da
 * requisição HTTP (SPR-012.md, Bloco A). Isso permite implementar e testar
 * este repository antes de `ListCampaignsQueryDto`/`CampaignOwnershipGuard`
 * existirem (Blocos B/C).
 *
 * Sem autorização, sem verificação de usuário autenticado ou papel — essa
 * responsabilidade pertence exclusivamente a `CampaignOwnershipGuard`
 * (Bloco B, ver ADR-011). Este repository apenas encapsula acesso ao
 * Prisma para o agregado `Campaign`.
 */
@Injectable()
export class CampaignsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Campaign | null> {
    return this.prisma.campaign.findUnique({ where: { id } });
  }

  /**
   * Lista campanhas de um projeto, paginadas e opcionalmente filtradas por
   * status. A tradução de valores vindos da API (ex.: `?status=ALL` para
   * "sem filtro", ou o default `ACTIVE` quando omitido) é responsabilidade
   * de uma camada superior (Service/Controller, Bloco B/C) — aqui, ausência
   * de `status` significa, literalmente, nenhum filtro de status aplicado.
   */
  async findManyByProject(params: {
    projectId: string;
    status?: CampaignStatus;
    skip: number;
    take: number;
  }): Promise<{ items: Campaign[]; total: number }> {
    const { projectId, status, skip, take } = params;
    const where = { projectId, ...(status ? { status } : {}) };

    const [items, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return { items, total };
  }

  create(data: {
    projectId: string;
    name: string;
    description?: string;
  }): Promise<Campaign> {
    return this.prisma.campaign.create({ data });
  }

  update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Campaign> {
    return this.prisma.campaign.update({ where: { id }, data });
  }

  updateStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return this.prisma.campaign.update({ where: { id }, data: { status } });
  }
}
