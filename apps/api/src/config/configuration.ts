import { Environment } from './env.validation';

/**
 * Configuração da aplicação em si: identidade (nome/versão), ambiente de
 * execução e porta HTTP. Agrupada separadamente de "database" porque tende
 * a crescer com preocupações transversais (ex.: URL pública, timezone),
 * enquanto "database" cresce com preocupações de conexão/driver.
 */
export interface ApplicationConfig {
  name: string;
  version: string;
  nodeEnv: Environment;
  port: number;
}

/**
 * Configuração de conexão com o banco de dados. Hoje contém apenas os
 * campos efetivamente consumidos pela aplicação (o adapter PrismaPg usa
 * uma connection string única). Novos campos (ex.: host/port/user/senha
 * individuais, SSL) devem ser adicionados aqui somente quando alguma
 * funcionalidade real passar a precisar deles — não antes.
 */
export interface DatabaseConfig {
  url: string;
}

/**
 * Configuração da estratégia de autenticação (ADR-002 / SPR-006).
 * `accessTtl`/`refreshTtl` seguem o formato aceito por `@nestjs/jwt`
 * (`expiresIn`), ex.: "15m", "7d".
 */
export interface JwtConfig {
  secret: string;
  accessTtl: string;
  refreshTtl: string;
}

/**
 * Grupos previstos para o futuro (ainda não implementados): storage, ai,
 * uploads, logging. Ao introduzir um deles, siga o mesmo padrão:
 * (1) crie a interface do grupo, (2) adicione-a aqui, (3) popule-a no
 * factory abaixo, (4) exponha os valores tipados via um método/getter
 * dedicado em AppConfigService — nunca via ConfigService.get() cru fora
 * deste módulo.
 */
export interface AppConfig {
  application: ApplicationConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
}

/**
 * Fábrica de configuração carregada pelo ConfigModule.
 * Único ponto de leitura do process.env da aplicação: qualquer novo
 * valor de configuração deve ser adicionado aqui, nunca lido
 * diretamente via process.env em outro lugar do código.
 */
export default (): AppConfig => ({
  application: {
    name: process.env.APP_NAME ?? 'Content OS',
    version: process.env.APP_VERSION ?? '0.0.0',
    nodeEnv: (process.env.NODE_ENV as Environment) ?? Environment.Development,
    port: parseInt(process.env.PORT ?? '3001', 10),
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
});
