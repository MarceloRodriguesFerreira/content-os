import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token ausente, inválido ou expirado.',
  })
  async getMe(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdOrFail(currentUser.sub);
    return this.usersService.toResponseDto(user);
  }
}
