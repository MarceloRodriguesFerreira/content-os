import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: 'content-os-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}