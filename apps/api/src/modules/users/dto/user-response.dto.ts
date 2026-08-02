import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../../generated/prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'clx1y2z3a0000qzrm5g8j9k1a' })
  id: string;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ example: 'Ana Souza' })
  name: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @ApiProperty({ example: '2026-07-27T12:00:00.000Z' })
  createdAt: string;
}
