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
 * Hoje só `url` é efetivamente usada (pelo PrismaPg adapter). Os demais
 * campos ficam reservados e não são lidos por nenhum consumidor ainda:
 * existem para permitir, no futuro, montar a connection string a partir de
 * parâmetros individuais (útil para providers gerenciados que não expõem
 * uma URL única, ou para exigir SSL de forma explícita) sem precisar
 * redesenhar a interface ou os pontos que consomem ConfigService.
 */
export interface DatabaseConfig {
  url: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

/**
 * Grupos previstos para o futuro (ainda não implementados): jwt, storage,
 * ai, uploads, logging. Ao introduzir um deles, siga o mesmo padrão:
 * (1) crie a interface do grupo, (2) adicione-a aqui, (3) popule-a no
 * factory abaixo, (4) exponha os valores tipados via um método/getter
 * dedicado em AppConfigService — nunca via ConfigService.get() cru fora
 * deste módulo.
 */
export interface AppConfig {
  application: ApplicationConfig;
  database: DatabaseConfig;
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
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : undefined,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL
      ? process.env.DATABASE_SSL === 'true'
      : undefined,
  },
});
