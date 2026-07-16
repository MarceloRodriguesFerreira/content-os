import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './configuration';

/**
 * Wrapper tipado sobre o ConfigService do @nestjs/config.
 * Todo o resto da aplicação deve depender deste serviço (e não do
 * ConfigService genérico, nem de process.env) para ler configuração.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  get nodeEnv(): string {
    return this.configService.get('nodeEnv', { infer: true });
  }

  get port(): number {
    return this.configService.get('port', { infer: true });
  }

  get appName(): string {
    return this.configService.get('app.name', { infer: true });
  }

  get appVersion(): string {
    return this.configService.get('app.version', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('database.url', { infer: true });
  }
}
