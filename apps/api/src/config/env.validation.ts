import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  APP_NAME: string;

  @IsString()
  @IsNotEmpty()
  APP_VERSION: string;
}

/**
 * Função de validação usada pelo ConfigModule (@nestjs/config).
 *
 * Roda uma única vez, no bootstrap, antes de qualquer módulo da aplicação
 * ser instanciado. Isso é intencional: preferimos que a aplicação nem
 * suba (fail-fast) a subir com uma variável obrigatória ausente ou
 * malformada e só descobrir isso mais tarde, em runtime, quando algo
 * tentar usar esse valor (ex.: uma conexão de banco falhando silenciosamente
 * horas depois do deploy).
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');

    throw new Error(`Configuração inválida: ${messages}`);
  }

  return validatedConfig;
}
