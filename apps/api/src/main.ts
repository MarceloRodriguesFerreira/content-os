import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const appConfigService = app.get(AppConfigService);

  const port = appConfigService.port;

  await app.listen(port);

  logger.log(`🚀 API running on http://localhost:${port}`);
}

void bootstrap();
