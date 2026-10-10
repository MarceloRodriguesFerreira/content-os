import { Module } from '@nestjs/common';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';
import { PublicationsRepository } from './repositories/publications.repository';
import { PublicationOwnershipGuard } from './guards/publication-ownership.guard';
import { ContentModule } from '../content/content.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { ProjectsModule } from '../projects/projects.module';

/**
 * Bloco C (SPR-014): API HTTP completa. Registrado em `AppModule` a
 * partir deste bloco — antes disso (Blocos A/B), `PublicationsController`
 * não existia.
 *
 * Importa `ContentModule` (para `ContentsRepository`, já exportado por
 * ele), `CampaignsModule` (para `CampaignsRepository`) e `ProjectsModule`
 * (para `ProjectsRepository`) — os três consumidos por
 * `PublicationOwnershipGuard` (ADR-013). Diferente de `ContentModule`
 * (dois saltos), `PublicationModule` precisa dos três, já que a cadeia de
 * ownership de `Publication` tem três saltos de repository
 * (`Content`/`Campaign`/`Project`) — `ContentModule` não reexporta
 * `CampaignsRepository`/`ProjectsRepository`.
 */
@Module({
  controllers: [PublicationsController],
  imports: [ContentModule, CampaignsModule, ProjectsModule],
  providers: [
    PublicationsService,
    PublicationsRepository,
    PublicationOwnershipGuard,
  ],
  exports: [PublicationsService, PublicationsRepository],
})
export class PublicationModule {}
