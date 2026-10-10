import { ApiProperty } from '@nestjs/swagger';
import {
  Publication,
  PublicationChannel,
  PublicationStatus,
} from '../../../../generated/prisma/client';

/**
 * Mesma convenção de `ContentResponseDto`: classe com `@ApiProperty()` em
 * cada campo, nunca reexportar o model do Prisma diretamente na resposta
 * HTTP (ADR-010).
 *
 * Expõe `contentId`, não `ownerId`/`campaignId`/`projectId` — `Publication`
 * não tem `ownerId` próprio (ADR-013); o vínculo público exposto é só com
 * o pai imediato, mesmo critério de `ContentResponseDto` só expor
 * `campaignId`.
 */
export class PublicationResponseDto {
  @ApiProperty({ example: 'clx1y2z3a0000qzrm5g8j9k1a' })
  id: string;

  @ApiProperty({
    enum: PublicationChannel,
    example: PublicationChannel.INSTAGRAM,
  })
  channel: PublicationChannel;

  @ApiProperty({ enum: PublicationStatus, example: PublicationStatus.DRAFT })
  status: PublicationStatus;

  @ApiProperty({ example: '2026-11-01T12:00:00.000Z', nullable: true })
  scheduledAt: string | null;

  @ApiProperty({ example: 'clx1y2z3a0000qzrm5g8j9k1a' })
  contentId: string;

  @ApiProperty({ example: '2026-08-17T14:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-17T14:00:00.000Z' })
  updatedAt: string;

  static fromEntity(publication: Publication): PublicationResponseDto {
    const dto = new PublicationResponseDto();
    dto.id = publication.id;
    dto.channel = publication.channel;
    dto.status = publication.status;
    dto.scheduledAt = publication.scheduledAt
      ? publication.scheduledAt.toISOString()
      : null;
    dto.contentId = publication.contentId;
    dto.createdAt = publication.createdAt.toISOString();
    dto.updatedAt = publication.updatedAt.toISOString();
    return dto;
  }
}
