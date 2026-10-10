import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PublicationChannel } from '../../../../generated/prisma/client';

/**
 * `contentId`/`campaignId` não são campos deste DTO — vêm sempre da rota
 * (ADR-013, mesmo motivo de `CreateContentDto.campaignId` não existir).
 *
 * `scheduledAt` também não é um campo aqui — a criação resulta sempre em
 * `DRAFT` com `scheduledAt = null` (`PublicationsService.create`, Bloco B
 * aprovado). Agendar é uma operação explícita (`PATCH` com
 * `status: SCHEDULED`), não um efeito colateral de `create`. Como o
 * contrato HTTP nem aceita esse campo, uma tentativa de enviá-lo é
 * rejeitada por `forbidNonWhitelisted` (ADR-003), não por uma validação de
 * negócio.
 */
export class CreatePublicationDto {
  @ApiProperty({
    enum: PublicationChannel,
    example: PublicationChannel.INSTAGRAM,
  })
  @IsEnum(PublicationChannel)
  channel: PublicationChannel;
}
