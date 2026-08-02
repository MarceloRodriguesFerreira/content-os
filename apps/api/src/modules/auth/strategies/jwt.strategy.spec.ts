import { JwtStrategy } from './jwt.strategy';
import { AppConfigService } from '../../../config/app-config.service';
import { Role } from '../../../../generated/prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  it('retorna o próprio payload em validate() (vira request.user), incluindo role', () => {
    const configService = {
      jwtSecret: 'test-secret',
    } as AppConfigService;

    const strategy = new JwtStrategy(configService);
    const payload: JwtPayload = {
      sub: 'u1',
      email: 'ana@example.com',
      role: Role.ADMIN,
    };

    expect(strategy.validate(payload)).toEqual(payload);
  });
});
