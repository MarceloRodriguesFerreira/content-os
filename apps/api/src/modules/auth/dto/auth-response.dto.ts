import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Access token JWT, curta duração (ver JWT_ACCESS_TTL).',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token opaco, longa duração (ver JWT_REFRESH_TTL).',
    example: 'k7h2j9f1a0e6b3c4d5f7a8b9c0d1e2f3-base64url',
  })
  refreshToken: string;
}
