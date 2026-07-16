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
 * Única função da aplicação autorizada a ler `process.env` diretamente.
 * É registrada via `ConfigModule.forRoot({ load: [configuration] })` e
 * roda depois que `env.validation.ts` já validou as variáveis obrigatórias.
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
