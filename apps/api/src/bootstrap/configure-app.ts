import { INestApplication, VersioningType } from '@nestjs/common';

/**
 * Configuração de bootstrap compartilhada entre produção (`main.ts`) e
 * testes E2E (`test/*.e2e-spec.ts`).
 *
 * Existe porque `app.enableVersioning()` (ao contrário de
 * `ValidationPipe`/`AllExceptionsFilter`/`TransformInterceptor`, Bloco B)
 * não tem equivalente via token de DI (`APP_PIPE`/`APP_FILTER`/
 * `APP_INTERCEPTOR`) — é uma chamada imperativa na instância
 * `NestApplication`, então só existe onde a aplicação é de fato
 * bootstrapada. Sem esta função compartilhada, produção e testes E2E
 * poderiam divergir silenciosamente (ver `ADR-005`, seção "Compatibilidade
 * e impactos").
 *
 * Qualquer configuração de bootstrap futura que não seja expressável via DI
 * deve entrar aqui, não em um novo ponto de configuração paralelo.
 *
 * IMPORTANTE: deve ser chamada antes de `setupSwagger()` — o Swagger só
 * reflete os paths versionados (`/v1/...`) corretamente se o versionamento
 * já estiver habilitado no momento em que o documento OpenAPI é gerado.
 */
export function configureApp(app: INestApplication): void {
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
}
