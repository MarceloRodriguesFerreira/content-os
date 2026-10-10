import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PublicationStatus } from '../../../../generated/prisma/client';

export class ListPublicationsQueryDto {
  /**
   * Valor padrão resolvido aqui, mesmo motivo de `ListContentsQueryDto.page`:
   * `PublicationsService.list` (Bloco C) exige `page`/`limit` como `number`
   * obrigatórios.
   */
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  /**
   * Diferente de `ListContentsQueryDto.status` (`ACTIVE` por padrão,
   * `'ALL'` remove o filtro): `Publication` não tem um estado "arquivado"
   * para ocultar por padrão, então omitido aqui já significa "sem
   * filtro" — não há sentinela `'ALL'`.
   */
  @ApiPropertyOptional({
    enum: PublicationStatus,
    example: PublicationStatus.SCHEDULED,
    description: 'Filtra por status. Omitido lista DRAFT e SCHEDULED juntos.',
  })
  @IsOptional()
  @IsEnum(PublicationStatus)
  status?: PublicationStatus;
}
