import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: 'content-os-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
