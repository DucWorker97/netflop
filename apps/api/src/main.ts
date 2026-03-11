import 'reflect-metadata';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SecurityConfig } from './config/security.config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const security = configService.getOrThrow<SecurityConfig>('security');
    app.getHttpAdapter().getInstance().disable('x-powered-by');

    // Global prefix for API routes (except health)
    app.setGlobalPrefix('api', {
        exclude: ['health'],
    });

    app.enableCors({
        origin: security.cors.origins,
        credentials: security.cors.credentials,
    });

    // Request ID middleware
    app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Security Headers
    app.use(helmet());

    const port = Number(configService.get<string>('PORT') || '3000');
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 API running on http://localhost:${port}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
}

bootstrap();
