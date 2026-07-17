import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
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
  constructor(appConfigService: AppConfigService) {
    const adapter = new PrismaPg({
      connectionString: appConfigService.databaseUrl,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
