import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @Global() + escopo padrão (singleton, implícito em todo @Injectable())
 * garantem que existe exatamente uma instância de PrismaService — e,
 * portanto, uma única conexão/pool com o banco — para todo o processo da
 * aplicação. Nenhum módulo precisa (nem deve) declarar seu próprio
 * provider de Prisma; todos importam essa mesma instância.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
