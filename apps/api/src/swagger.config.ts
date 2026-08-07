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
        'conteúdo para redes sociais utilizando Inteligência Artificial.\n\n' +
        '**Formato de resposta (SPR-008, Bloco B / ADR-007):** toda resposta ' +
        '2xx vem envelopada como `{ success: true, data, timestamp }`, em que ' +
        '`data` é exatamente o schema documentado abaixo para cada rota — ' +
        'exceto respostas `204 No Content` (ex.: `POST /auth/logout`), que não ' +
        'têm corpo. Toda resposta de erro (4xx/5xx) vem como ' +
        '`{ success: false, error: { statusCode, error, message }, path, timestamp }`.\n\n' +
        '**Paginação (SPR-009, ADR-010):** toda listagem usa offset-based ' +
        '(`page`/`limit`, ambos opcionais) e responde `data: { items, meta }`, ' +
        'em que `meta` é `{ page, limit, total, totalPages }`. Filtros são ' +
        'declarados por módulo via query params simples (ex.: ' +
        '`GET /v1/projects?status=ARCHIVED`), sem linguagem de query genérica.',
    )
    .setVersion('1.0')
    .addTag('App', 'Endpoints gerais da aplicação')
    .addTag('Health', 'Verificação de disponibilidade da API')
    .addTag('Auth', 'Autenticação: login, refresh e logout')
    .addTag('Users', 'Dados do usuário autenticado')
    .addTag(
      'Projects',
      'Gestão de projetos — agregado raiz do domínio de conteúdo (SPR-009)',
    )
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Access token JWT obtido em POST /auth/login ou /auth/refresh.',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
