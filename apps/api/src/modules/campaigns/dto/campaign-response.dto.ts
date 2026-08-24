import { ApiProperty } from '@nestjs/swagger';
import { Campaign, CampaignStatus } from '../../../../generated/prisma/client';

/**
 * Mesma convenção de `ProjectResponseDto`: classe com `@ApiProperty()` em
 * cada campo, nunca reexportar o model do Prisma diretamente na resposta
 * HTTP (ADR-010).
 *
 * Expõe `projectId`, não `ownerId` — `Campaign` não tem `ownerId` próprio
 * (ADR-011); o vínculo público com o recurso pai é `projectId`.
 *
 * `fromEntity` vive aqui, não em `CampaignsService`, pelo mesmo motivo de
 * `ProjectResponseDto.fromEntity`: é mapeamento de apresentação (Prisma
 * `Date` → `string` ISO), sem regra de negócio, e o Service (Bloco B) já
 * está aprovado e não deve ser alterado por este bloco.
 */
export class CampaignResponseDto {
  @ApiProperty({ example: 'clx1y2z3a0000qzrm5g8j9k1a' })
  id: string;

  @ApiProperty({ example: 'Campanha de Lançamento Q3' })
  name: string;

  @ApiProperty({
    example: 'Campanha de anúncios para o lançamento do produto X.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ enum: CampaignStatus, example: CampaignStatus.ACTIVE })
  status: CampaignStatus;

  @ApiProperty({ example: 'clx1y2z3a0000qzrm5g8j9k1a' })
  projectId: string;

  @ApiProperty({ example: '2026-08-17T14:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-17T14:00:00.000Z' })
  updatedAt: string;

  static fromEntity(campaign: Campaign): CampaignResponseDto {
    const dto = new CampaignResponseDto();
    dto.id = campaign.id;
    dto.name = campaign.name;
    dto.description = campaign.description;
    dto.status = campaign.status;
    dto.projectId = campaign.projectId;
    dto.createdAt = campaign.createdAt.toISOString();
    dto.updatedAt = campaign.updatedAt.toISOString();
    return dto;
  }
}
