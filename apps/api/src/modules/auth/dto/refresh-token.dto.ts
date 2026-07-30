import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token opaco emitido no login ou na última rotação.',
    example: 'k7h2j9f1a0e6b3c4d5f7a8b9c0d1e2f3-base64url',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
