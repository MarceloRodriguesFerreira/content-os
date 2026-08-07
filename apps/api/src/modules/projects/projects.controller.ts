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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ProjectOwnershipGuard } from './guards/project-ownership.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

/**
 * Controller fino (padrão `AuthController`/`UsersController`): sem regra
 * de negócio aqui — apenas extração de contexto HTTP (`@CurrentUser`,
 * `@Body`/`@Query`/`@Param`), delegação ao `ProjectsService` (Bloco B,
 * inalterado) e mapeamento `Project` → `ProjectResponseDto`.
 *
 * `ProjectOwnershipGuard` (ADR-009) é aplicado explicitamente por rota —
 * não é global — apenas nas rotas que operam sobre um `:id` específico.
 * `POST /` e `GET /` não o usam: criar não tem um recurso prévio para ser
 * "dono", e a listagem já se auto-restringe ao `ownerId` do usuário
 * autenticado (design doc, seção Autorização).
 */
@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um projeto para o usuário autenticado' })
  @ApiResponse({
    status: 201,
    description: 'Projeto criado.',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.create(currentUser.sub, dto);
    return ProjectResponseDto.fromEntity(project);
  }

  @Get()
  @ApiExtraModels(PaginatedResponseDto, ProjectResponseDto)
  @ApiOperation({
    summary: 'Lista os projetos do usuário autenticado, paginados/filtrados',
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
              items: { $ref: getSchemaPath(ProjectResponseDto) },
            },
          },
        },
      ],
    },
  })
  async list(
    @Query() query: ListProjectsQueryDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<PaginatedResponseDto<ProjectResponseDto>> {
    const result = await this.projectsService.list(currentUser.sub, query);

    return {
      items: result.items.map((project) =>
        ProjectResponseDto.fromEntity(project),
      ),
      meta: result.meta,
    };
  }

  @Get(':id')
  @UseGuards(ProjectOwnershipGuard)
  @ApiOperation({ summary: 'Retorna o detalhe de um projeto' })
  @ApiResponse({
    status: 200,
    description: 'Projeto encontrado.',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Você não tem permissão para acessar este projeto.',
  })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  async findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    const project = await this.projectsService.findById(id);
    return ProjectResponseDto.fromEntity(project);
  }

  @Patch(':id')
  @UseGuards(ProjectOwnershipGuard)
  @ApiOperation({ summary: 'Atualiza name/description de um projeto' })
  @ApiResponse({
    status: 200,
    description: 'Projeto atualizado.',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Nenhum campo informado, ou dados inválidos.',
  })
  @ApiResponse({
    status: 403,
    description: 'Você não tem permissão para editar este projeto.',
  })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.update(id, dto);
    return ProjectResponseDto.fromEntity(project);
  }

  @Post(':id/archive')
  @UseGuards(ProjectOwnershipGuard)
  // 200, não 201 (default de @Post): arquivar não cria um recurso, é uma
  // transição de estado sobre um recurso existente — ver ADR-008/design
  // doc, que já justifica POST (em vez de PATCH/status) para archive/
  // restore, mas não fixa o status code de sucesso; 200 é a decisão de
  // implementação consistente com a semântica "não é criação".
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arquiva um projeto ativo (ACTIVE → ARCHIVED)' })
  @ApiResponse({
    status: 200,
    description: 'Projeto arquivado.',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Você não tem permissão para arquivar este projeto.',
  })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  @ApiResponse({ status: 409, description: 'Projeto já está arquivado.' })
  async archive(@Param('id') id: string): Promise<ProjectResponseDto> {
    const project = await this.projectsService.archive(id);
    return ProjectResponseDto.fromEntity(project);
  }

  @Post(':id/restore')
  @UseGuards(ProjectOwnershipGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restaura um projeto arquivado (ARCHIVED → ACTIVE)',
  })
  @ApiResponse({
    status: 200,
    description: 'Projeto restaurado.',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Você não tem permissão para restaurar este projeto.',
  })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  @ApiResponse({ status: 409, description: 'Projeto já está ativo.' })
  async restore(@Param('id') id: string): Promise<ProjectResponseDto> {
    const project = await this.projectsService.restore(id);
    return ProjectResponseDto.fromEntity(project);
  }
}
