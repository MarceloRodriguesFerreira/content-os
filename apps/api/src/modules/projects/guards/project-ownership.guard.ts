import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsRepository } from '../repositories/projects.repository';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { Role } from '../../../../generated/prisma/client';

interface RequestWithUserAndParams {
  user: JwtPayload;
  params: { id: string };
}

/**
 * Autorização por propriedade de recurso (ADR-009). Não é global — precisa
 * ser aplicado explicitamente via `@UseGuards(ProjectOwnershipGuard)` nas
 * rotas que operam sobre um projeto específico (`:id` no path).
 *
 * Pressupõe que `JwtAuthGuard` (global) já populou `request.user` e que a
 * rota roda depois dele na cadeia `JwtAuthGuard → RolesGuard →
 * ProjectOwnershipGuard` (ADR-009).
 *
 * Busca o projeto via `ProjectsRepository` — nunca acessa o Prisma
 * diretamente, mesmo padrão de separação já usado no restante do projeto.
 */
@Injectable()
export class ProjectOwnershipGuard implements CanActivate {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithUserAndParams>();
    const { user, params } = request;

    const project = await this.projectsRepository.findById(params.id);

    // 404, nunca 403, para um projeto de outro dono: não revela a um
    // usuário não-dono que aquele id existe (ADR-009 — enumeration
    // prevention). Mesmo comportamento para "não existe" e "existe mas não
    // é seu e você não é admin" seria incorreto — a distinção é feita a
    // seguir.
    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    const isOwner = project.ownerId === user.sub;
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este projeto.',
      );
    }

    return true;
  }
}
