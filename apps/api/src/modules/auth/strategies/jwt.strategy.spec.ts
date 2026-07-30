import { JwtStrategy } from './jwt.strategy';
import { AppConfigService } from '../../../config/app-config.service';

describe('JwtStrategy', () => {
  it('retorna o próprio payload em validate() (vira request.user)', () => {
    const configService = {
      jwtSecret: 'test-secret',
    } as AppConfigService;

    const strategy = new JwtStrategy(configService);
    const payload = { sub: 'u1', email: 'ana@example.com' };

    expect(strategy.validate(payload)).toEqual(payload);
  });
});
