import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Verifica a disponibilidade da API',
    description:
      'Endpoint de health check. Retorna o status atual do serviço, útil para monitoramento e orquestradores (Docker, Kubernetes, etc.).',
  })
  @ApiResponse({
    status: 200,
    description: 'API operacional.',
    type: HealthResponseDto,
  })
  getHealth(): HealthResponseDto {
    return this.healthService.getHealth();
  }
}
