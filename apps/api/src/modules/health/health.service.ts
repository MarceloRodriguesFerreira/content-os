import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class HealthService {
  constructor(private readonly configService: AppConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      service: this.configService.appName,
      version: this.configService.appVersion,
      timestamp: new Date().toISOString(),
    };
  }
}
