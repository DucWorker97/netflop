import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown> | null;
        requestId: string;
    };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const requestId = (request as Request & { requestId?: string }).requestId || 'unknown';

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_SERVER_ERROR';
        let message = 'An unexpected error occurred';
        let details: Record<string, unknown> | null = null;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as Record<string, unknown>;
                message = (resp.message as string) || message;
                code = (resp.code as string) || this.getCodeFromStatus(status);
                details = (resp.details as Record<string, unknown>) || null;

                // Handle class-validator errors
                if (Array.isArray(resp.message)) {
                    message = 'Validation failed';
                    code = 'VALIDATION_FAILED';
                    details = { errors: resp.message };
                }
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            console.error('Unhandled exception:', exception);
        }

        const errorResponse: ErrorResponse = {
            error: {
                code,
                message,
                details,
                requestId,
            },
        };

        response.status(status).json(errorResponse);
    }

    private getCodeFromStatus(status: number): string {
        switch (status) {
            case 400:
                return 'BAD_REQUEST';
            case 401:
                return 'UNAUTHORIZED';
            case 403:
                return 'FORBIDDEN';
            case 404:
                return 'NOT_FOUND';
            case 409:
                return 'CONFLICT';
            case 422:
                return 'VALIDATION_FAILED';
            default:
                return 'INTERNAL_SERVER_ERROR';
        }
    }
}
