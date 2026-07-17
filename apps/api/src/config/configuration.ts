export interface AppConfig {
  nodeEnv: string;
  port: number;
  app: {
    name: string;
    version: string;
  };
  database: {
    url: string;
  };
}

/**
 * Fábrica de configuração carregada pelo ConfigModule.
 * Único ponto de leitura do process.env da aplicação: qualquer novo
 * valor de configuração deve ser adicionado aqui, nunca lido
 * diretamente via process.env em outro lugar do código.
 */
export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  app: {
    name: process.env.APP_NAME ?? 'Content OS',
    version: process.env.APP_VERSION ?? '0.0.0',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
});
