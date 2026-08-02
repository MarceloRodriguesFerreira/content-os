import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restringe uma rota a um ou mais papéis (RBAC — ADR-004). Deve ser usado em
 * conjunto com `@UseGuards(RolesGuard)` — o `RolesGuard` não é global, então
 * `@Roles()` sozinho não tem efeito nenhum.
 *
 * Rotas sem `@Roles()` continuam exigindo apenas autenticação (comportamento
 * herdado do `JwtAuthGuard` global, ADR-002) — `@Roles()` adiciona uma
 * restrição extra, não substitui a autenticação.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
