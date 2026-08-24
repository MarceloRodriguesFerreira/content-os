import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Mesmos campos de `CreateCampaignDto`, ambos `@IsOptional`. A regra "pelo
 * menos um deve ser enviado" é validada em `CampaignsService.update`
 * (regra de negócio, Bloco B já aprovado), não aqui (validação de forma)
 * — mesmo padrão de `UpdateProjectDto`.
 */
export class UpdateCampaignDto {
  @ApiPropertyOptional({ example: 'Novo nome da campanha', maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Descrição atualizada da campanha.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
