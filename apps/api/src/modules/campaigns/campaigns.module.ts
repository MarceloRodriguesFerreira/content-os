import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignsRepository } from './repositories/campaigns.repository';
import { CampaignOwnershipGuard } from './guards/campaign-ownership.guard';
import { ProjectsModule } from '../projects/projects.module';

/**
 * Bloco C (SPR-012): API HTTP completa. Registrado em `AppModule` a
 * partir deste bloco — antes disso (Bloco B), `CampaignsController` não
 * existia, então não havia rota a expor.
 *
 * Importa `ProjectsModule` para obter `ProjectsRepository`, já exportado
 * por ele — não há necessidade de alterar `ProjectsModule` para isso.
 */
@Module({
  controllers: [CampaignsController],
  imports: [ProjectsModule],
  providers: [CampaignsService, CampaignsRepository, CampaignOwnershipGuard],
  exports: [CampaignsService, CampaignsRepository, CampaignOwnershipGuard],
})
export class CampaignsModule {}
