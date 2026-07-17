import { validate } from './env.validation';

describe('env.validation', () => {
  const validEnv = {
    NODE_ENV: 'development',
    PORT: '3001',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    APP_NAME: 'Content OS',
    APP_VERSION: '0.2.0',
  };

  it('deve validar e converter um conjunto de variáveis válido', () => {
    const result = validate(validEnv);

    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3001);
    expect(typeof result.PORT).toBe('number');
    expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(result.APP_NAME).toBe('Content OS');
    expect(result.APP_VERSION).toBe('0.2.0');
  });

  it('deve lançar erro quando DATABASE_URL estiver ausente', () => {
    const envWithoutDatabaseUrl: Record<string, string> = { ...validEnv };
    delete envWithoutDatabaseUrl.DATABASE_URL;

    expect(() => validate(envWithoutDatabaseUrl)).toThrow(/DATABASE_URL/);
  });

  it('deve lançar erro quando NODE_ENV não for um valor do enum permitido', () => {
    expect(() => validate({ ...validEnv, NODE_ENV: 'invalid-env' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('deve lançar erro quando PORT não for numérico', () => {
    expect(() => validate({ ...validEnv, PORT: 'not-a-port' })).toThrow(/PORT/);
  });

  it('deve lançar erro quando APP_NAME estiver vazio', () => {
    expect(() => validate({ ...validEnv, APP_NAME: '' })).toThrow(/APP_NAME/);
  });
});
