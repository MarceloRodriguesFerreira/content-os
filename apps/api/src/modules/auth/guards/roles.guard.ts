import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CanActivate } from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Role } from '../../../../generated/prisma/client';

interface RequestWithUser {
  user: JwtPayload;
}

/**
 * Autorização por papel (RBAC — ADR-004). Não é global: só tem efeito nas
 * rotas que declaram `@UseGuards(RolesGuard)` junto de `@Roles(...)`.
 *
 * Pressupõe que a autenticação já foi resolvida pelo `JwtAuthGuard` global
 * (ADR-002) — `request.user` já está populado quando este guard executa.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sem @Roles() declarado: nenhuma restrição adicional além da
    // autenticação já garantida pelo JwtAuthGuard.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    return true;
  }
}
