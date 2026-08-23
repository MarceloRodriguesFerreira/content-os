import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsRepository } from './repositories/campaigns.repository';
import { CampaignOwnershipGuard } from './guards/campaign-ownership.guard';
import { ProjectsModule } from '../projects/projects.module';

/**
 * Bloco B (SPR-012): regras de negócio + ownership authorization.
 * `CampaignsController` chega no Bloco C — este módulo ainda não é
 * registrado em `app.module.ts` (sem Controller, não há rota HTTP a
 * expor).
 *
 * Importa `ProjectsModule` para obter `ProjectsRepository`, já exportado
 * por ele — não há necessidade de alterar `ProjectsModule` para isso.
 */
@Module({
  imports: [ProjectsModule],
  providers: [CampaignsService, CampaignsRepository, CampaignOwnershipGuard],
  exports: [CampaignsService, CampaignsRepository, CampaignOwnershipGuard],
})
export class CampaignsModule {}
