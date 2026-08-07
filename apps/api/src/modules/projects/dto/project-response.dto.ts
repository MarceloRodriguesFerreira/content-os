import { ApiProperty } from '@nestjs/swagger';
import { Project, ProjectStatus } from '../../../../generated/prisma/client';

/**
 * Mesma convenção de `UserResponseDto`: classe com `@ApiProperty()` em
 * cada campo, nunca reexportar o model do Prisma diretamente na resposta
 * HTTP (`ADR-010`).
 *
 * `fromEntity` vive aqui, não em `ProjectsService.toResponseDto` (que seria
 * o precedente de `UsersService`), porque a restrição desta entrega proíbe
 * alterar o Service — este mapeamento é puramente de apresentação (Prisma
 * `Date` → `string` ISO), sem regra de negócio, então mora no DTO em vez
 * de exigir tocar em um arquivo já aprovado no Bloco B.
 */
export class ProjectResponseDto {
  @ApiProperty({ example: 'clx1y2z3a0000qzrm5g8j9k1a' })
  id: string;

  @ApiProperty({ example: 'Campanha de Lançamento Q3' })
  name: string;

  @ApiProperty({
    example: 'Projeto de conteúdo para o lançamento do produto X.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @ApiProperty({ example: 'clx1y2z3a0000qzrm5g8j9k1a' })
  ownerId: string;

  @ApiProperty({ example: '2026-08-06T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-06T12:00:00.000Z' })
  updatedAt: string;

  static fromEntity(project: Project): ProjectResponseDto {
    const dto = new ProjectResponseDto();
    dto.id = project.id;
    dto.name = project.name;
    dto.description = project.description;
    dto.status = project.status;
    dto.ownerId = project.ownerId;
    dto.createdAt = project.createdAt.toISOString();
    dto.updatedAt = project.updatedAt.toISOString();
    return dto;
  }
}
