import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import configuration from './configuration';
import { AppConfigService } from './config.service';
import { validate } from './env.validation';

/**
 * Módulo global de configuração da aplicação.
 * Marcado como @Global() para seguir o mesmo padrão já usado pelo
 * PrismaModule, já que AppConfigService é uma dependência transversal
 * consumida por múltiplos módulos (Prisma, Health, etc.).
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
