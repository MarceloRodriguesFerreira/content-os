import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Mesmos campos de `CreateProjectDto`, ambos `@IsOptional` (design doc,
 * seção DTOs). A regra "pelo menos um deve ser enviado" é validada em
 * `ProjectsService.update` (regra de negócio), não aqui (validação de
 * forma) — por isso não há nenhum decorator de "ao menos um campo" neste
 * DTO.
 */
export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Novo nome do projeto', maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Descrição atualizada do projeto.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
