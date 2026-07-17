import { ConfigService } from '@nestjs/config';

import { AppConfigService } from './app-config.service';
import { AppConfig } from './configuration';
import { Environment } from './env.validation';

describe('AppConfigService', () => {
  const fakeConfig: AppConfig = {
    application: {
      name: 'Content OS',
      version: '0.2.0',
      nodeEnv: Environment.Test,
      port: 3001,
    },
    database: {
      url: 'postgresql://user:pass@localhost:5432/db',
    },
  };

  function createService(): AppConfigService {
    const configService = new ConfigService<AppConfig, true>(fakeConfig);
    return new AppConfigService(configService);
  }

  it('expõe applicationName a partir de application.name', () => {
    expect(createService().applicationName).toBe('Content OS');
  });

  it('expõe applicationVersion a partir de application.version', () => {
    expect(createService().applicationVersion).toBe('0.2.0');
  });

  it('expõe nodeEnv a partir de application.nodeEnv', () => {
    expect(createService().nodeEnv).toBe(Environment.Test);
  });

  it('expõe port a partir de application.port', () => {
    expect(createService().port).toBe(3001);
  });

  it('expõe databaseUrl a partir de database.url', () => {
    expect(createService().databaseUrl).toBe(fakeConfig.database.url);
  });
});
