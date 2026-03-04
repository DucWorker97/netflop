import 'reflect-metadata';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix for API routes (except health)
    app.setGlobalPrefix('api', {
        exclude: ['health'],
    });

    // CORS configuration
    // Note: Hardcoded origins because process.env is not yet loaded at bootstrap time
    // To change origins, modify this array directly
    const corsOrigins = [
        'http://localhost:3001', // Admin panel
        'http://localhost:3002', // Web viewer
        'http://localhost:19006', // Expo dev (legacy)
        'http://localhost:8081', // Expo dev
    ];
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
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

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 API running on http://localhost:${port}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
}

bootstrap();
