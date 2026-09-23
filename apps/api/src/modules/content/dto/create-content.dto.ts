import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * `campaignId` não é um campo deste DTO — vem sempre da rota
 * (`:campaignId`), nunca do body (ADR-012, mesmo motivo de
 * `CreateCampaignDto.projectId` não existir). O vínculo de propriedade
 * não é confiável se vier do cliente.
 */
export class CreateContentDto {
  @ApiProperty({ example: 'Post de lançamento — Instagram', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: 'Texto do post, incluindo hashtags e call-to-action.',
    maxLength: 10000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;
}
