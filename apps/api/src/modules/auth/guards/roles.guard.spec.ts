import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../../../generated/prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

describe('RolesGuard', () => {
  function createContext(user: JwtPayload): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  function createGuard(requiredRoles: Role[] | undefined): {
    guard: RolesGuard;
    reflector: Reflector;
  } {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector;

    return { guard: new RolesGuard(reflector), reflector };
  }

  it('permite acesso quando a rota não declara @Roles()', () => {
    const { guard, reflector } = createGuard(undefined);
    const context = createContext({
      sub: 'u1',
      email: 'ana@example.com',
      role: Role.USER,
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('permite acesso quando @Roles() é um array vazio', () => {
    const { guard } = createGuard([]);
    const context = createContext({
      sub: 'u1',
      email: 'ana@example.com',
      role: Role.USER,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite acesso quando o role do usuário está entre os exigidos', () => {
    const { guard } = createGuard([Role.ADMIN, Role.SUPER_ADMIN]);
    const context = createContext({
      sub: 'u1',
      email: 'admin@example.com',
      role: Role.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('lança ForbiddenException quando o role do usuário não está entre os exigidos', () => {
    const { guard } = createGuard([Role.ADMIN, Role.SUPER_ADMIN]);
    const context = createContext({
      sub: 'u1',
      email: 'ana@example.com',
      role: Role.USER,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
