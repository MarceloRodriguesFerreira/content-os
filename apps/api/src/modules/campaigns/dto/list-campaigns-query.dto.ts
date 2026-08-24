import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CampaignStatus } from '../../../../generated/prisma/client';

/**
 * `'ALL'` não é um valor do enum `CampaignStatus` — por isso `@IsIn(...)`
 * em vez de `@IsEnum(CampaignStatus)` sozinho, que rejeitaria `'ALL'`.
 * Mesmo padrão de `ListProjectsQueryDto` (ADR-010).
 */
const STATUS_FILTER_VALUES = [...Object.values(CampaignStatus), 'ALL'] as const;

type CampaignStatusFilter = (typeof STATUS_FILTER_VALUES)[number];

export class ListCampaignsQueryDto {
  /**
   * Valor padrão resolvido aqui (não deixado `undefined`) pelo mesmo
   * motivo de `ListProjectsQueryDto.page`: `CampaignsService.list` (Bloco
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
    example: CampaignStatus.ACTIVE,
    description:
      "Filtra por status. Omitido filtra apenas 'ACTIVE'. 'ALL' remove o filtro.",
  })
  @IsOptional()
  @IsIn(STATUS_FILTER_VALUES)
  status?: CampaignStatusFilter;
}
