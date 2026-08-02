import { Role } from '../../../../generated/prisma/client';

export interface JwtPayload {
  /** ID do usuário (subject do token). */
  sub: string;
  email: string;
  /** Papel único do usuário (RBAC — ADR-004). */
  role: Role;
}
