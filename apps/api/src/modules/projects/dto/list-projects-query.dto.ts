import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ProjectStatus } from '../../../../generated/prisma/client';

/**
 * `'ALL'` não é um valor do enum `ProjectStatus` — por isso `@IsIn(...)`
 * em vez de `@IsEnum(ProjectStatus)` sozinho, que rejeitaria `'ALL'`
 * (design doc, seção DTOs).
 */
const STATUS_FILTER_VALUES = [...Object.values(ProjectStatus), 'ALL'] as const;

type ProjectStatusFilter = (typeof STATUS_FILTER_VALUES)[number];

export class ListProjectsQueryDto {
  /**
   * Tem valor padrão (`= 1`) em vez de ficar `undefined` quando omitido —
   * decisão de implementação do Bloco C: `ProjectsService.list` (Bloco B,
   * já aprovado) exige `page`/`limit` como `number` obrigatórios, não
   * `number | undefined`, então a resolução do default precisa acontecer
   * antes do Service ser chamado. Só `status` mantém o default (`ACTIVE`
   * quando omitido) resolvido dentro do Service, como o design doc
   * especifica — page/limit não têm essa mesma exigência documentada, e
   * resolver o valor aqui evita introduzir no Controller uma lógica de
   * "se undefined, usar 1" que o `ValidationPipe`/`class-transformer` já
   * resolve de forma padrão e testável.
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
    example: ProjectStatus.ACTIVE,
    description:
      "Filtra por status. Omitido filtra apenas 'ACTIVE'. 'ALL' remove o filtro.",
  })
  @IsOptional()
  @IsIn(STATUS_FILTER_VALUES)
  status?: ProjectStatusFilter;
}
