import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Project, ProjectStatus } from '../../../../generated/prisma/client';

/**
 * Repository Pattern (ARCHITECTURE.md) — isola a camada de negócio do
 * Prisma diretamente, mantendo-a testável com mocks simples (mesmo padrão
 * de `UsersRepository`).
 *
 * Recebe apenas parâmetros primitivos ({ ownerId, status, skip, take }),
 * nunca os DTOs HTTP do Bloco C — a camada de persistência não conhece a
 * forma da requisição HTTP (SPR-009.md, Bloco A). Isso permite implementar
 * e testar este repository antes de `ListProjectsQueryDto` existir.
 */
@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }

  /**
   * Lista projetos de um dono, paginados e opcionalmente filtrados por
   * status. A tradução de valores vindos da API (ex.: `?status=ALL` para
   * "sem filtro", ou o default `ACTIVE` quando omitido) é responsabilidade
   * de uma camada superior (Service/Controller, Bloco B/C) — aqui, ausência
   * de `status` significa, literalmente, nenhum filtro de status aplicado.
   */
  async findManyByOwner(params: {
    ownerId: string;
    status?: ProjectStatus;
    skip: number;
    take: number;
  }): Promise<{ items: Project[]; total: number }> {
    const { ownerId, status, skip, take } = params;
    const where = { ownerId, ...(status ? { status } : {}) };

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { items, total };
  }

  create(data: {
    ownerId: string;
    name: string;
    description?: string;
  }): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data });
  }

  updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data: { status } });
  }
}
