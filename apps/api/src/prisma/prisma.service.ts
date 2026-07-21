import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppConfigService } from '../config/app-config.service';

/**
 * No Prisma 7, a conexão com o banco não é mais resolvida a partir da
 * URL declarada no schema.prisma (não há `url = env("DATABASE_URL")`
 * ali) — o client passa a exigir um "driver adapter" (aqui, PrismaPg)
 * explicitamente instanciado e passado para o super() do PrismaClient.
 * Por isso a connection string precisa estar disponível de forma
 * síncrona já no constructor, antes de qualquer lifecycle hook do Nest
 * (onModuleInit): não dá para adiar essa leitura para depois da injeção
 * normal de dependências terminar.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(appConfigService: AppConfigService) {
    const adapter = new PrismaPg({
      connectionString: appConfigService.databaseUrl,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexão com o banco de dados estabelecida.');
    } catch (error) {
      // Falha ao conectar é tratada como impedimento para a aplicação
      // subir (fail-fast, mesmo princípio adotado para configuração
      // inválida na SPR-003): melhor a API nem responder requisições do
      // que subir "no ar" sem conseguir falar com o banco. Relançamos o
      // erro para que o Nest aborte o bootstrap.
      this.logger.error(
        'Falha ao conectar ao banco de dados.',
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Conexão com o banco de dados encerrada.');
    } catch (error) {
      // Diferente do onModuleInit, aqui a aplicação já está em processo
      // de shutdown: registramos o erro para investigação, mas não faz
      // sentido impedir o encerramento por causa disso.
      this.logger.error(
        'Falha ao encerrar a conexão com o banco de dados.',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
