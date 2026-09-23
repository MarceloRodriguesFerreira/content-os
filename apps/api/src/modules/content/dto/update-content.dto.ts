import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Mesmos campos de `CreateContentDto`, ambos `@IsOptional`. A regra "pelo
 * menos um deve ser enviado" é validada em `ContentsService.update`
 * (regra de negócio, Bloco B já aprovado), não aqui (validação de forma)
 * — mesmo padrão de `UpdateCampaignDto`.
 */
export class UpdateContentDto {
  @ApiPropertyOptional({
    example: 'Post de lançamento — Instagram (revisado)',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Texto revisado do post, incluindo hashtags e call-to-action.',
    maxLength: 10000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;
}
