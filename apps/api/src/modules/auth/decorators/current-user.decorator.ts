import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

interface RequestWithUser {
  user: JwtPayload;
}

/**
 * Extrai o payload do usuário autenticado, já validado pelo JwtStrategy
 * e anexado a `request.user` pelo Passport.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
