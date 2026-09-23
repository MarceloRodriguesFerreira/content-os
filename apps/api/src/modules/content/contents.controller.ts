import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ContentsService } from './contents.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ListContentsQueryDto } from './dto/list-contents-query.dto';
import { ContentResponseDto } from './dto/content-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ContentOwnershipGuard } from './guards/content-ownership.guard';

/**
 * Controller fino (mesmo padrão de `CampaignsController`): sem regra de
 * negócio aqui — apenas extração de contexto HTTP (`@Param`/`@Body`/
 * `@Query`), delegação ao `ContentsService` (Bloco B, inalterado) e
 * mapeamento `Content` → `ContentResponseDto`.
 *
 * `ContentOwnershipGuard` (ADR-012) é aplicado nas **cinco** rotas,
 * incluindo `create`/`list` — mesmo critério de `CampaignsController`:
 * `Content` não tem `ownerId` próprio, então toda rota já parte de um
 * `:campaignId` que precisa ser validado, através de `Campaign` e
 * `Project`, como pertencente ao usuário autenticado antes de qualquer
 * operação.
 *
 * Não usa `@CurrentUser()` — nenhuma operação deste Controller depende do
 * usuário autenticado além da autorização já resolvida pelo guard, mesmo
 * critério de `CampaignsController`.
 */
@ApiTags('Contents')
@ApiBearerAuth()
@Controller('campaigns/:campaignId/contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Post()
  @UseGuards(ContentOwnershipGuard)
  @ApiOperation({ summary: 'Cria um conteúdo dentro de uma campanha' })
  @ApiResponse({
    status: 201,
    description: 'Conteúdo criado.',
    type: ContentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Campanha não encontrada, projeto ancestral não encontrado, ou ' +
      'não pertence ao usuário (ADR-012).',
  })
  async create(
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateContentDto,
  ): Promise<ContentResponseDto> {
    const content = await this.contentsService.create(campaignId, dto);
    return ContentResponseDto.fromEntity(content);
  }

  @Get()
  @UseGuards(ContentOwnershipGuard)
  @ApiExtraModels(PaginatedResponseDto, ContentResponseDto)
  @ApiOperation({
    summary: 'Lista os conteúdos de uma campanha, paginados/filtrados',
  })
  @ApiOkResponse({
    description:
      "Lista paginada. `status` omitido filtra apenas 'ACTIVE'; " +
      "'ALL' remove o filtro (mesmo padrão de Campaign, ADR-010).",
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(ContentResponseDto) },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Campanha não encontrada, projeto ancestral não encontrado, ou ' +
      'não pertence ao usuário (ADR-012).',
  })
  async list(
    @Param('campaignId') campaignId: string,
    @Query() query: ListContentsQueryDto,
  ): Promise<PaginatedResponseDto<ContentResponseDto>> {
    const result = await this.contentsService.list(campaignId, query);

    return {
      items: result.items.map((content) =>
        ContentResponseDto.fromEntity(content),
      ),
      meta: result.meta,
    };
  }

  @Get(':id')
  @UseGuards(ContentOwnershipGuard)
  @ApiOperation({ summary: 'Retorna o detalhe de um conteúdo' })
  @ApiResponse({
    status: 200,
    description: 'Conteúdo encontrado.',
    type: ContentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Conteúdo não encontrado, conteúdo de outra campanha, campanha ' +
      'não encontrada, projeto ancestral não encontrado, ou não ' +
      'pertence ao usuário (ADR-012).',
  })
  async findOne(@Param('id') id: string): Promise<ContentResponseDto> {
    const content = await this.contentsService.findById(id);
    return ContentResponseDto.fromEntity(content);
  }

  @Patch(':id')
  @UseGuards(ContentOwnershipGuard)
  @ApiOperation({ summary: 'Atualiza name/body de um conteúdo' })
  @ApiResponse({
    status: 200,
    description: 'Conteúdo atualizado.',
    type: ContentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Nenhum campo informado, ou dados inválidos.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Conteúdo não encontrado, conteúdo de outra campanha, campanha ' +
      'não encontrada, projeto ancestral não encontrado, ou não ' +
      'pertence ao usuário (ADR-012).',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ): Promise<ContentResponseDto> {
    const content = await this.contentsService.update(id, dto);
    return ContentResponseDto.fromEntity(content);
  }

  @Post(':id/archive')
  @UseGuards(ContentOwnershipGuard)
  // 200, não 201 (default de @Post): arquivar não cria um recurso, é uma
  // transição de estado sobre um recurso existente — mesma decisão de
  // CampaignsController.archive.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Arquiva um conteúdo ativo (ACTIVE → ARCHIVED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteúdo arquivado.',
    type: ContentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Conteúdo não encontrado, conteúdo de outra campanha, campanha ' +
      'não encontrada, projeto ancestral não encontrado, ou não ' +
      'pertence ao usuário (ADR-012).',
  })
  @ApiResponse({ status: 409, description: 'Conteúdo já está arquivado.' })
  async archive(@Param('id') id: string): Promise<ContentResponseDto> {
    const content = await this.contentsService.archive(id);
    return ContentResponseDto.fromEntity(content);
  }
}
