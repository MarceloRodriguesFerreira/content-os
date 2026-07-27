import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Caminho onde a documentação interativa (Swagger UI) fica disponível.
 * Mantido como constante exportada para que outros pontos do bootstrap
 * (ex.: logs de inicialização) possam referenciá-lo sem duplicar a string.
 */
export const SWAGGER_PATH = 'api/docs';

/**
 * Configura o OpenAPI/Swagger da API.
 *
 * Centralizado aqui (fora de main.ts) para que, conforme novos módulos de
 * negócio forem chegando (Release 0.4+), a configuração do documento
 * (tags, esquemas de segurança, etc.) tenha um único lugar para crescer,
 * sem inflar o bootstrap da aplicação.
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Content OS API')
    .setDescription(
      'Plataforma inteligente para criação, organização e publicação de ' +
        'conteúdo para redes sociais utilizando Inteligência Artificial.',
    )
    .setVersion('1.0')
    .addTag('App', 'Endpoints gerais da aplicação')
    .addTag('Health', 'Verificação de disponibilidade da API')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
