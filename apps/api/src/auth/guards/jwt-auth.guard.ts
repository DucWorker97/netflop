import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        console.log('[JwtAuthGuard] Guard triggered');
        const request = context.switchToHttp().getRequest();
        console.log('[JwtAuthGuard] Authorization header:', request.headers.authorization);
        return super.canActivate(context);
    }
}
