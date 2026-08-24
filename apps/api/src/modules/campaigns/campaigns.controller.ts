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
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ListCampaignsQueryDto } from './dto/list-campaigns-query.dto';
import { CampaignResponseDto } from './dto/campaign-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CampaignOwnershipGuard } from './guards/campaign-ownership.guard';

/**
 * Controller fino (mesmo padrão de `ProjectsController`): sem regra de
 * negócio aqui — apenas extração de contexto HTTP (`@Param`/`@Body`/
 * `@Query`), delegação ao `CampaignsService` (Bloco B, inalterado) e
 * mapeamento `Campaign` → `CampaignResponseDto`.
 *
 * Diferente de `ProjectsController`, `CampaignOwnershipGuard` (ADR-011) é
 * aplicado nas **cinco** rotas, incluindo `create`/`list` — porque, ao
 * contrário de `Project` (raiz do agregado, dono resolvido diretamente por
 * `ownerId`), toda rota de `Campaign` já parte de um `:projectId` que
 * precisa ser validado como pertencente ao usuário autenticado antes de
 * qualquer operação, já que `Campaign` não tem `ownerId` próprio para
 * autorrestringir a query (ADR-011, seção "Consequences").
 *
 * Não usa `@CurrentUser()` — nenhuma operação deste Controller depende do
 * usuário autenticado além da autorização já resolvida pelo guard (a
 * diferença central com `ProjectsController.create`/`list`, que usam
 * `currentUser.sub` como `ownerId`; `Campaign` deriva propriedade do
 * `Project` pai, não do usuário diretamente).
 */
@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('projects/:projectId/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Cria uma campanha dentro de um projeto' })
  @ApiResponse({
    status: 201,
    description: 'Campanha criada.',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description: 'Projeto não encontrado, ou não pertence ao usuário.',
  })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.create(projectId, dto);
    return CampaignResponseDto.fromEntity(campaign);
  }

  @Get()
  @UseGuards(CampaignOwnershipGuard)
  @ApiExtraModels(PaginatedResponseDto, CampaignResponseDto)
  @ApiOperation({
    summary: 'Lista as campanhas de um projeto, paginadas/filtradas',
  })
  @ApiOkResponse({
    description:
      "Lista paginada. `status` omitido filtra apenas 'ACTIVE'; " +
      "'ALL' remove o filtro (ADR-010).",
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(CampaignResponseDto) },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description: 'Projeto não encontrado, ou não pertence ao usuário.',
  })
  async list(
    @Param('projectId') projectId: string,
    @Query() query: ListCampaignsQueryDto,
  ): Promise<PaginatedResponseDto<CampaignResponseDto>> {
    const result = await this.campaignsService.list(projectId, query);

    return {
      items: result.items.map((campaign) =>
        CampaignResponseDto.fromEntity(campaign),
      ),
      meta: result.meta,
    };
  }

  @Get(':id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Retorna o detalhe de uma campanha' })
  @ApiResponse({
    status: 200,
    description: 'Campanha encontrada.',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Campanha não encontrada, campanha de outro projeto, projeto não ' +
      'encontrado, ou projeto não pertence ao usuário (ADR-011).',
  })
  async findOne(@Param('id') id: string): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.findById(id);
    return CampaignResponseDto.fromEntity(campaign);
  }

  @Patch(':id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Atualiza name/description de uma campanha' })
  @ApiResponse({
    status: 200,
    description: 'Campanha atualizada.',
    type: CampaignResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Nenhum campo informado, ou dados inválidos.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Campanha não encontrada, campanha de outro projeto, projeto não ' +
      'encontrado, ou projeto não pertence ao usuário (ADR-011).',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.update(id, dto);
    return CampaignResponseDto.fromEntity(campaign);
  }

  @Post(':id/archive')
  @UseGuards(CampaignOwnershipGuard)
  // 200, não 201 (default de @Post): arquivar não cria um recurso, é uma
  // transição de estado sobre um recurso existente — mesma decisão de
  // ProjectsController.archive (ADR-010 estabelece operação dedicada, não
  // fixa o status code; 200 é consistente com "não é criação").
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Arquiva uma campanha ativa (ACTIVE → ARCHIVED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Campanha arquivada.',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 404,
    description:
      'Campanha não encontrada, campanha de outro projeto, projeto não ' +
      'encontrado, ou projeto não pertence ao usuário (ADR-011).',
  })
  @ApiResponse({ status: 409, description: 'Campanha já está arquivada.' })
  async archive(@Param('id') id: string): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.archive(id);
    return CampaignResponseDto.fromEntity(campaign);
  }
}
