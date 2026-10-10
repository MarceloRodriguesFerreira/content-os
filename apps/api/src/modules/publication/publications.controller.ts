import {
  Body,
  Controller,
  Get,
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
import { PublicationsService } from './publications.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { ListPublicationsQueryDto } from './dto/list-publications-query.dto';
import { PublicationResponseDto } from './dto/publication-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PublicationOwnershipGuard } from './guards/publication-ownership.guard';
import { PublicationStatus } from '../../../generated/prisma/client';

/**
 * Controller fino (mesmo padrão de `ContentsController`): sem regra de
 * negócio — apenas extração de contexto HTTP, delegação ao
 * `PublicationsService` (Bloco B, inalterado nas regras de lifecycle) e
 * mapeamento `Publication` → `PublicationResponseDto`.
 *
 * `PublicationOwnershipGuard` (ADR-013) é aplicado nas **quatro** rotas,
 * incluindo `create`/`list` — `Publication` não tem `ownerId` próprio, e
 * `:contentId` (sempre presente na rota) precisa ser validado através de
 * Content → Campaign → Project antes de qualquer operação.
 *
 * `update` não contém nenhuma regra de negócio: só decide, pelo `status`
 * alvo do DTO, qual método do Service chamar. Toda validação (obrigação e
 * futuridade de `scheduledAt`, rejeição de transição para o mesmo estado)
 * já está em `PublicationsService.schedule`/`unschedule`.
 */
@ApiTags('Publications')
@ApiBearerAuth()
@Controller('campaigns/:campaignId/contents/:contentId/publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Post()
  @UseGuards(PublicationOwnershipGuard)
  @ApiOperation({
    summary: 'Cria uma publication (sempre em DRAFT) para um conteúdo',
  })
  @ApiResponse({
    status: 201,
    description: 'Publication criada, em DRAFT, scheduledAt = null.',
    type: PublicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Conteúdo não encontrado, ancestral (campanha/projeto) não ' +
      'encontrado, ou não pertence ao usuário (ADR-013).',
  })
  async create(
    @Param('contentId') contentId: string,
    @Body() dto: CreatePublicationDto,
  ): Promise<PublicationResponseDto> {
    const publication = await this.publicationsService.create(contentId, dto);
    return PublicationResponseDto.fromEntity(publication);
  }

  @Get()
  @UseGuards(PublicationOwnershipGuard)
  @ApiExtraModels(PaginatedResponseDto, PublicationResponseDto)
  @ApiOperation({
    summary: 'Lista as publications de um conteúdo, paginadas/filtradas',
  })
  @ApiOkResponse({
    description:
      'Lista paginada. `status` omitido lista DRAFT e SCHEDULED juntos ' +
      '(Publication não tem estado "arquivado" para ocultar por padrão).',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(PublicationResponseDto) },
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
      'Conteúdo não encontrado, ancestral não encontrado, ou não ' +
      'pertence ao usuário (ADR-013).',
  })
  async list(
    @Param('contentId') contentId: string,
    @Query() query: ListPublicationsQueryDto,
  ): Promise<PaginatedResponseDto<PublicationResponseDto>> {
    const result = await this.publicationsService.list(contentId, query);

    return {
      items: result.items.map((publication) =>
        PublicationResponseDto.fromEntity(publication),
      ),
      meta: result.meta,
    };
  }

  @Get(':id')
  @UseGuards(PublicationOwnershipGuard)
  @ApiOperation({ summary: 'Retorna o detalhe de uma publication' })
  @ApiResponse({
    status: 200,
    description: 'Publication encontrada.',
    type: PublicationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Publication não encontrada, publication de outro conteúdo, ' +
      'conteúdo não encontrado, ancestral não encontrado, ou não ' +
      'pertence ao usuário (ADR-013).',
  })
  async findOne(@Param('id') id: string): Promise<PublicationResponseDto> {
    const publication = await this.publicationsService.findById(id);
    return PublicationResponseDto.fromEntity(publication);
  }

  @Patch(':id')
  @UseGuards(PublicationOwnershipGuard)
  @ApiOperation({
    summary:
      'Transiciona o lifecycle (DRAFT → SCHEDULED agenda; SCHEDULED → ' +
      'DRAFT desagenda e limpa scheduledAt)',
  })
  @ApiResponse({
    status: 200,
    description: 'Publication atualizada.',
    type: PublicationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'scheduledAt ausente (DTO) ou não-futuro (Service) ao agendar; ' +
      'scheduledAt enviado junto com status=DRAFT (DTO, UpdatePublicationDto).',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Publication não encontrada, publication de outro conteúdo, ' +
      'conteúdo não encontrado, ancestral não encontrado, ou não ' +
      'pertence ao usuário (ADR-013).',
  })
  @ApiResponse({
    status: 409,
    description:
      'Transição não permitida: publication já está no status alvo ' +
      '(SPR-014, Bloco B).',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePublicationDto,
  ): Promise<PublicationResponseDto> {
    const publication =
      dto.status === PublicationStatus.SCHEDULED
        ? await this.publicationsService.schedule(id, dto.scheduledAt)
        : await this.publicationsService.unschedule(id);

    return PublicationResponseDto.fromEntity(publication);
  }
}
