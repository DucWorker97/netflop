import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Auth Guard - allows unauthenticated requests but still
 * extracts user if valid token is present
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        // Try to authenticate, but don't fail if no token
        return super.canActivate(context);
    }

    handleRequest<TUser = any>(err: Error | null, user: TUser | false): TUser | null {
        // Return user if valid, null otherwise (don't throw on auth failure)
        if (err || !user) {
            return null as TUser | null;
        }
        return user;
    }
}
