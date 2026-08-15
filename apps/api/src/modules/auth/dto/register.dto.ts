import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Contrato HTTP exclusivo do registro público (`POST /v1/auth/register`,
 * Bloco C). Classe própria, não reaproveita `CreateUserDto` — isola a
 * evolução futura da política pública de registro do uso interno/seed de
 * `UsersService.create()` (Design Freeze da SPR-011).
 *
 * Sem campo `role`: o cliente nunca pode escolhê-la. Mesmo que tentasse,
 * `forbidNonWhitelisted: true` (ValidationPipe global, `app.module.ts`)
 * rejeitaria a requisição com `400` por conter um campo não declarado aqui.
 */
export class RegisterDto {
  @ApiProperty({ example: 'Ana Souza' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3nhaForte!23', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
