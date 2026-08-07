import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Página atual (1-based).' })
  page: number;

  @ApiProperty({ example: 20, description: 'Itens por página.' })
  limit: number;

  @ApiProperty({ example: 42, description: 'Total de itens, sem paginação.' })
  total: number;

  @ApiProperty({ example: 3, description: 'Total de páginas.' })
  totalPages: number;
}

/**
 * Wrapper genérico de listagem paginada (`ADR-010`). Diferente dos DTOs de
 * entrada (query), este é compartilhado entre módulos desde já — um tipo
 * parametrizado não duplica código por módulo, então não há o mesmo custo
 * de abstração prematura que levou a manter `ListProjectsQueryDto`
 * específico do módulo `projects`.
 *
 * `items` não é decorado com `@ApiProperty()` aqui de propósito: o
 * reflection do `@nestjs/swagger` não resolve `T` em tempo de execução para
 * uma classe genérica TypeScript. Cada Controller que expõe uma listagem
 * documenta o shape concreto de `items` via `@ApiExtraModels` +
 * `getSchemaPath()` no próprio decorator da rota (ver
 * `ProjectsController.list`), sem precisar de uma subclasse concreta por
 * módulo.
 */
export class PaginatedResponseDto<T> {
  items: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
