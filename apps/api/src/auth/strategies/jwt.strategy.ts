import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        const secretOrKey = configService.get<string>('JWT_SECRET');
        if (!secretOrKey) {
            throw new Error('JWT_SECRET is not configured');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey,
        });
    }

    async validate(payload: JwtPayload) {
        console.log('[JwtStrategy] Validating payload:', payload);
        const user = await this.usersService.findById(payload.sub);
        console.log('[JwtStrategy] Found user:', user ? `${user.email} (${user.id})` : 'NULL');
        if (!user) {
            throw new UnauthorizedException({
                code: 'AUTH_INVALID_TOKEN',
                message: 'Invalid token',
            });
        }
        return user;
    }
}
