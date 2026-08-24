import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * `projectId` não é um campo deste DTO — vem sempre da rota (`:projectId`),
 * nunca do body (ADR-011/design doc do SPR-012, seção 9). Mesmo motivo
 * `ownerId` não existe em `CreateProjectDto`: o vínculo de propriedade não
 * é confiável se vier do cliente.
 */
export class CreateCampaignDto {
  @ApiProperty({ example: 'Campanha de Lançamento Q3', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: 'Campanha de anúncios para o lançamento do produto X.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
