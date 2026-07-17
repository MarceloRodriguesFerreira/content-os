import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from './configuration';
import { Environment } from './env.validation';

/**
 * Fachada tipada sobre o ConfigService do @nestjs/config.
 *
 * O restante da aplicação não deve conhecer as chaves internas de
 * configuração (ex.: "application.name", "database.url") nem chamar
 * configService.get(...) diretamente. Isso mantém a estrutura interna de
 * configuration.ts livre para mudar (renomear grupos, mover campos) sem
 * exigir alterações em cada consumidor — só neste service.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  get applicationName(): string {
    return this.configService.get('application.name', { infer: true });
  }

  get applicationVersion(): string {
    return this.configService.get('application.version', { infer: true });
  }

  get nodeEnv(): Environment {
    return this.configService.get('application.nodeEnv', { infer: true });
  }

  get port(): number {
    return this.configService.get('application.port', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('database.url', { infer: true });
  }
}
