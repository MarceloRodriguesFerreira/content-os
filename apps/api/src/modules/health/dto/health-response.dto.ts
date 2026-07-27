import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Indica se a API está operacional.',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'Nome do serviço que respondeu à verificação.',
    example: 'content-os-api',
  })
  service: string;

  @ApiProperty({
    description: 'Versão da API em execução.',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: 'Data e hora da verificação, em formato ISO 8601.',
    example: '2026-07-23T12:00:00.000Z',
  })
  timestamp: string;
}
