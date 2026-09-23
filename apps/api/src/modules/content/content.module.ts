import { Module } from '@nestjs/common';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { ContentsRepository } from './repositories/contents.repository';
import { ContentOwnershipGuard } from './guards/content-ownership.guard';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { ProjectsModule } from '../projects/projects.module';

/**
 * Bloco C (SPR-013): API HTTP completa. Registrado em `AppModule` a
 * partir deste bloco — antes disso (Blocos A/B), `ContentsController`
 * não existia, então não havia rota a expor.
 *
 * Importa `CampaignsModule` (para `CampaignsRepository`, já exportado por
 * ele) e `ProjectsModule` (para `ProjectsRepository`, já exportado por
 * ele) — ambos consumidos por `ContentOwnershipGuard` (ADR-012). Diferente
 * de `CampaignsModule`, que só precisa de `ProjectsModule` (cadeia de um
 * salto), `ContentModule` precisa dos dois, já que a cadeia de ownership
 * de `Content` tem dois saltos (`Content.campaignId → Campaign.projectId
 * → Project.ownerId`) e `CampaignsModule` não reexporta
 * `ProjectsRepository`.
 */
@Module({
  controllers: [ContentsController],
  imports: [CampaignsModule, ProjectsModule],
  providers: [ContentsService, ContentsRepository, ContentOwnershipGuard],
  exports: [ContentsService, ContentsRepository, ContentOwnershipGuard],
})
export class ContentModule {}
