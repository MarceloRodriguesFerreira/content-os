import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ContentStatus } from '../../../../generated/prisma/client';

/**
 * `'ALL'` não é um valor do enum `ContentStatus` — por isso `@IsIn(...)`
 * em vez de `@IsEnum(ContentStatus)` sozinho, que rejeitaria `'ALL'`.
 * Mesmo padrão de `ListCampaignsQueryDto` (ADR-010).
 */
const STATUS_FILTER_VALUES = [...Object.values(ContentStatus), 'ALL'] as const;

type ContentStatusFilter = (typeof STATUS_FILTER_VALUES)[number];

export class ListContentsQueryDto {
  /**
   * Valor padrão resolvido aqui (não deixado `undefined`) pelo mesmo
   * motivo de `ListCampaignsQueryDto.page`: `ContentsService.list` (Bloco
   * B, já aprovado) exige `page`/`limit` como `number` obrigatórios.
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

  @ApiPropertyOptional({
    enum: STATUS_FILTER_VALUES,
    example: ContentStatus.ACTIVE,
    description:
      "Filtra por status. Omitido filtra apenas 'ACTIVE'. 'ALL' remove o filtro.",
  })
  @IsOptional()
  @IsIn(STATUS_FILTER_VALUES)
  status?: ContentStatusFilter;
}
