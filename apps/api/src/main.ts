import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { setupSwagger, SWAGGER_PATH } from './swagger.config';
import { configureApp } from './bootstrap/configure-app';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Sem isso, o Nest não escuta SIGTERM/SIGINT do processo, então
  // onModuleDestroy() (que fecha a conexão do Prisma) nunca é chamado
  // quando o container é encerrado (ex.: redeploy, `docker stop`,
  // rolling update no k8s) — a conexão simplesmente é derrubada de forma
  // abrupta em vez de ser fechada de forma limpa.
  app.enableShutdownHooks();

  // Ordem obrigatória: configureApp() habilita o versionamento antes do
  // Swagger ser montado — caso contrário, o documento OpenAPI é gerado sem
  // os paths /v1/... (ver ADR-005, SPR-008-bloco-c-platform.md).
  configureApp(app);
  setupSwagger(app);

  const appConfigService = app.get(AppConfigService);

  const port = appConfigService.port;

  await app.listen(port);

  logger.log(`🚀 API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/${SWAGGER_PATH}`);
}

void bootstrap();
