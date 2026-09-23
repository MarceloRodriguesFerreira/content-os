import { ApiProperty } from '@nestjs/swagger';
import { Content, ContentStatus } from '../../../../generated/prisma/client';

/**
 * Mesma convenção de `CampaignResponseDto`: classe com `@ApiProperty()` em
 * cada campo, nunca reexportar o model do Prisma diretamente na resposta
 * HTTP (ADR-010).
 *
 * Expõe `campaignId`, não `ownerId` nem `projectId` — `Content` não tem
 * `ownerId` próprio (ADR-012); o vínculo público com o recurso pai direto
 * é `campaignId`. `projectId` (avô) não é exposto, mesmo critério de só
 * expor o vínculo direto com o pai imediato.
 *
 * `fromEntity` vive aqui, não em `ContentsService`, pelo mesmo motivo de
 * `CampaignResponseDto.fromEntity`: é mapeamento de apresentação (Prisma
 * `Date` → `string` ISO), sem regra de negócio, e o Service (Bloco B) já
 * está aprovado e não deve ser alterado por este bloco.
 */
export class ContentResponseDto {
  @ApiProperty({ example: 'clx1y2z3a0000qzrm5g8j9k1a' })
  id: string;

  @ApiProperty({ example: 'Post de lançamento — Instagram' })
  name: string;

  @ApiProperty({
    example: 'Texto do post, incluindo hashtags e call-to-action.',
    nullable: true,
  })
  body: string | null;

  @ApiProperty({ enum: ContentStatus, example: ContentStatus.ACTIVE })
  status: ContentStatus;

  @ApiProperty({ example: 'clx1y2z3a0000qzrm5g8j9k1a' })
  campaignId: string;

  @ApiProperty({ example: '2026-08-17T14:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-17T14:00:00.000Z' })
  updatedAt: string;

  static fromEntity(content: Content): ContentResponseDto {
    const dto = new ContentResponseDto();
    dto.id = content.id;
    dto.name = content.name;
    dto.body = content.body;
    dto.status = content.status;
    dto.campaignId = content.campaignId;
    dto.createdAt = content.createdAt.toISOString();
    dto.updatedAt = content.updatedAt.toISOString();
    return dto;
  }
}
