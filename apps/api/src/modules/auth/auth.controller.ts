import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica um usuário e emite access + refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registra um novo usuário e emite access + refresh token',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado e autenticado.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado.' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotaciona o refresh token e emite um novo par de tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Refresh token inválido, expirado, ou já utilizado (nesse caso, toda a sessão do usuário é revogada).',
  })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoga o refresh token informado' })
  @ApiResponse({ status: 204, description: 'Logout realizado.' })
  @ApiResponse({
    status: 401,
    description: 'Access token ausente, inválido ou expirado.',
  })
  async logout(
    @Body() dto: RefreshTokenDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<void> {
    await this.authService.logout(dto.refreshToken, currentUser.sub);
  }
}
