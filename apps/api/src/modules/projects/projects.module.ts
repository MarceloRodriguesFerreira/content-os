import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './repositories/projects.repository';
import { ProjectOwnershipGuard } from './guards/project-ownership.guard';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository, ProjectOwnershipGuard],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
