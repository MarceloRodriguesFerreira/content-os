import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { UsersModule } from '../users/users.module';
import { AppConfigService } from '../../config/app-config.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService): JwtModuleOptions => ({
        secret: configService.jwtSecret,
        signOptions: {
          expiresIn: configService.jwtAccessTtl,
        } as JwtModuleOptions['signOptions'],
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokensRepository],
})
export class AuthModule {}
