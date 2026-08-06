import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsRepository } from './repositories/projects.repository';
import { Project, ProjectStatus } from '../../../generated/prisma/client';

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
 * Regras de negócio do agregado `Project` (ADR-008). Não conhece DTOs HTTP
 * nem faz verificação de propriedade (`ownerId === request.user.sub`) — essa
 * responsabilidade é do `ProjectOwnershipGuard` (ADR-009), que roda antes do
 * Controller (Bloco C) chamar este Service. Este Service confia que, quando
 * chamado, a autorização já foi resolvida.
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  /**
   * `ownerId` vem do usuário autenticado (nunca do corpo da requisição —
   * ver "Fluxo de Autenticação" no design doc), por isso é um parâmetro
   * explícito, não parte de `data`.
   */
  create(
    ownerId: string,
    data: { name: string; description?: string },
  ): Promise<Project> {
    return this.projectsRepository.create({
      ownerId,
      name: data.name,
      description: data.description,
    });
  }

  /**
   * Busca um projeto pelo id ou lança `404`. Diferente de
   * `ProjectsRepository.findById`, que retorna `null` — este método já
   * aplica a regra de negócio "projeto inexistente é um erro" para quem o
   * chama (reaproveitado por `update`/`archive`/`restore`).
   */
  async findById(id: string): Promise<Project> {
    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    return project;
  }

  /**
   * Atualização parcial de `name`/`description`. Permitida mesmo com o
   * projeto `ARCHIVED` (ADR-008/design doc: editar metadados de algo
   * arquivado é manutenção legítima, não uma mudança de ciclo de vida).
   *
   * A regra "pelo menos um campo deve ser enviado" é validada aqui, não no
   * DTO (design doc, seção DTOs) — `UpdateProjectDto` marca ambos os campos
   * `@IsOptional`, então a combinação vazia só é rejeitável como regra de
   * negócio, não como validação de forma.
   */
  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Project> {
    if (data.name === undefined && data.description === undefined) {
      throw new BadRequestException(
        'Pelo menos um campo (name ou description) deve ser informado.',
      );
    }

    await this.findById(id);

    return this.projectsRepository.update(id, data);
  }

  /**
   * `ACTIVE` → `ARCHIVED`. Não idempotente por design (design doc, "Regras
   * de negócio adicionais"): arquivar um projeto já arquivado é `409`, não
   * um sucesso silencioso.
   */
  async archive(id: string): Promise<Project> {
    const project = await this.findById(id);

    if (project.status === ProjectStatus.ARCHIVED) {
      throw new ConflictException('Projeto já está arquivado.');
    }

    return this.projectsRepository.updateStatus(id, ProjectStatus.ARCHIVED);
  }

  /**
   * `ARCHIVED` → `ACTIVE`. Mesma regra de não-idempotência de `archive`.
   */
  async restore(id: string): Promise<Project> {
    const project = await this.findById(id);

    if (project.status === ProjectStatus.ACTIVE) {
      throw new ConflictException('Projeto já está ativo.');
    }

    return this.projectsRepository.updateStatus(id, ProjectStatus.ACTIVE);
  }

  /**
   * Lista projetos do dono, paginada e filtrada por status.
   *
   * Traduz a semântica de API (`status` omitido → filtra `ACTIVE` por
   * padrão; `status: 'ALL'` → sem filtro) para o contrato primitivo do
   * `ProjectsRepository` (`status` ausente = sem filtro), porque essa
   * tradução é responsabilidade do Service, não do Repository (Bloco A) nem
   * do DTO (`ListProjectsQueryDto`, Bloco C — que ainda não existe nesta
   * sprint). Ver design doc, seção DTOs, para a justificativa de
   * `'ALL'` não ser um valor do enum `ProjectStatus`.
   */
  async list(
    ownerId: string,
    params: { page: number; limit: number; status?: ProjectStatus | 'ALL' },
  ): Promise<PaginatedResult<Project>> {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;
    const resolvedStatus =
      status === 'ALL' ? undefined : (status ?? ProjectStatus.ACTIVE);

    const { items, total } = await this.projectsRepository.findManyByOwner({
      ownerId,
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
