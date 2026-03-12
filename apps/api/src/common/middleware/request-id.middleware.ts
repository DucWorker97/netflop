import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            startTime?: number;
        }
    }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const requestId = (req.headers['x-request-id'] as string) || uuidv4();
        const startTime = Date.now();

        req.requestId = requestId;
        req.startTime = startTime;
        res.setHeader('x-request-id', requestId);

        // Log request on finish
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const { method, originalUrl } = req;
            const { statusCode } = res;

            // Don't log health checks to reduce noise
            if (originalUrl === '/health') return;

            // Structured log
            this.logger.log(
                JSON.stringify({
                    service: 'api',
                    env: process.env.NODE_ENV || 'development',
                    type: 'http',
                    requestId,
                    method,
                    path: originalUrl,
                    status: statusCode,
                    durationMs: duration,
                    userAgent: req.headers['user-agent']?.substring(0, 100),
                })
            );
        });

        next();
    }
}
