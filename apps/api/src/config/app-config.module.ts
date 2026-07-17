import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService } from './app-config.service';
import configuration from './configuration';
import { validate } from './env.validation';

/**
 * Módulo global de configuração. Encapsula o ConfigModule.forRoot do
 * @nestjs/config (load + validate) e expõe apenas o AppConfigService para
 * o resto da aplicação — nenhum outro módulo deve importar ConfigModule
 * ou injetar ConfigService diretamente.
 *
 * Marcado @Global() pelo mesmo motivo do PrismaModule: configuração é uma
 * dependência transversal, usada por módulos que não deveriam precisar
 * declarar um import explícito só para ler variáveis de ambiente.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
