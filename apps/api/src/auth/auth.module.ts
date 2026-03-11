import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { SecurityConfig } from '../config/security.config';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const security = configService.getOrThrow<SecurityConfig>('security');
                return {
                    secret: configService.getOrThrow<string>('JWT_SECRET'),
                    signOptions: {
                        expiresIn: security.auth.jwt.accessTtl,
                    },
                };
            },
            inject: [ConfigService],
        }),
        UsersModule,
        MailModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, CaptchaService, JwtStrategy],
    exports: [AuthService, CaptchaService, JwtModule],
})
export class AuthModule { }
