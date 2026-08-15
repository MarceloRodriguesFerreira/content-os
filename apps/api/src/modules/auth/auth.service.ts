import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { AppConfigService } from '../../config/app-config.service';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../../../generated/prisma/client';

/** Entropia do refresh token opaco (SPR-006, seção 7.2): 64 bytes = 512 bits. */
const REFRESH_TOKEN_BYTES = 64;

interface IssuedTokens {
  response: AuthResponseDto;
  refreshTokenRecordId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);

    // Mesma mensagem genérica para e-mail inexistente e senha incorreta —
    // não revelar se o e-mail está cadastrado.
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { response } = await this.issueTokens(user);

    return response;
  }

  /**
   * Registra um novo usuário e já o autentica, emitindo o mesmo par de
   * tokens que `login()` — evita o passo extra de "registrar, depois
   * logar" (Design Freeze da SPR-011, seção "Autenticação após registro").
   *
   * `RegisterDto` nunca é repassado inteiro a `UsersService.create()` — o
   * mapeamento é explícito, campo a campo, para `CreateUserInput`. Isso
   * mantém `RegisterDto` (DTO HTTP, decorado com `@ApiProperty`/
   * `class-validator`) estritamente do lado de `AuthController`, sem
   * cruzar a fronteira de `UsersModule` (Design Freeze da SPR-011, seção
   * "Contrato interno entre AuthService e UsersService").
   *
   * Normalização de e-mail, tratamento de e-mail duplicado (inclusive sob
   * concorrência, via `P2002`) e política de senha são responsabilidade de
   * `UsersService.create()` (Bloco A) — não duplicados aqui.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });

    const { response } = await this.issueTokens(user);

    return response;
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokensRepository.findByHash(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    if (stored.revokedAt) {
      // Reuso detectado (ADR-002, seção 7.4): o token já havia sido
      // rotacionado/revogado antes — sinal de possível comprometimento.
      // Revoga toda a família de tokens do usuário.
      await this.refreshTokensRepository.revokeAllForUser(stored.userId);

      throw new UnauthorizedException(
        'Refresh token já utilizado. Todas as sessões foram revogadas por segurança.',
      );
    }

    const user = await this.usersService.findByIdOrFail(stored.userId);

    const { response, refreshTokenRecordId } = await this.issueTokens(user);

    await this.refreshTokensRepository.markRotated(
      stored.id,
      refreshTokenRecordId,
    );

    return response;
  }

  /**
   * Revoga o refresh token informado, se pertencer ao usuário autenticado.
   * Idempotente e silencioso (não vaza se o token existe/pertence a outro
   * usuário) — comportamento esperado de um logout.
   */
  async logout(refreshToken: string, userId: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokensRepository.findByHash(tokenHash);

    if (!stored || stored.userId !== userId) {
      return;
    }

    await this.refreshTokensRepository.revoke(stored.id);
  }

  private async issueTokens(user: User): Promise<IssuedTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(refreshToken);

    const created = await this.refreshTokensRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: this.calculateRefreshExpiry(),
    });

    return {
      response: { accessToken, refreshToken },
      refreshTokenRecordId: created.id,
    };
  }

  private generateOpaqueToken(): string {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  }

  /**
   * SHA-256, não bcrypt (SPR-006, seção 7.2): o refresh token já é gerado
   * com alta entropia (aleatório), diferente de uma senha de baixa entropia
   * escolhida por humano — o custo computacional do bcrypt aqui seria
   * desperdiçado, sem ganho de segurança real.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private calculateRefreshExpiry(): Date {
    const ttlMs = this.parseTtlToMs(this.configService.jwtRefreshTtl);
    return new Date(Date.now() + ttlMs);
  }

  /**
   * Parser mínimo para o formato aceito por JWT_REFRESH_TTL (ex.: "7d",
   * "15m"). Implementado localmente para não adicionar uma dependência
   * (`ms`) fora da lista de bibliotecas autorizadas nesta sprint.
   */
  private parseTtlToMs(ttl: string): number {
    const match = /^(\d+)(ms|s|m|h|d)$/.exec(ttl.trim());

    if (!match) {
      throw new Error(
        `JWT_REFRESH_TTL inválido: "${ttl}". Use um número seguido de ms, s, m, h ou d (ex.: "7d").`,
      );
    }

    const value = Number(match[1]);
    const unit = match[2] as 'ms' | 's' | 'm' | 'h' | 'd';

    const unitToMs: Record<'ms' | 's' | 'm' | 'h' | 'd', number> = {
      ms: 1,
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return value * unitToMs[unit];
  }
}
