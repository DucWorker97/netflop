import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GenresModule } from './genres/genres.module';
import { MoviesModule } from './movies/movies.module';
import { FavoritesModule } from './favorites/favorites.module';
import { HistoryModule } from './history/history.module';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';
import { RatingsModule } from './ratings/ratings.module';
import { EventsModule } from './events/events.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ActorsModule } from './actors/actors.module';
import { RailsModule } from './rails/rails.module';
import { ProfilesModule } from './profiles/profiles.module';
import { BillingModule } from './billing/billing.module';
import { AiModule } from './ai/ai.module';
import { AccountModule } from './account/account.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import securityConfig from './config/security.config';
import { validateEnvironment } from './config/env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            expandVariables: true,
            envFilePath: ['../../.env', '.env'],
            load: [securityConfig],
            validate: validateEnvironment,
        }),
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 20,
            },
            {
                name: 'medium',
                ttl: 10000,
                limit: 100,
            },
            {
                name: 'long',
                ttl: 60000,
                limit: 300,
            },
        ]),
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
                port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379', 10),
            },
        }),
        PrismaModule,
        CommonModule,
        AuthModule,
        UsersModule,
        GenresModule,
        MoviesModule,
        FavoritesModule,
        HistoryModule,
        UploadModule,
        AdminModule,
        RatingsModule,
        EventsModule,
        RecommendationsModule,
        ActorsModule,
        RailsModule,
        ProfilesModule,
        AiModule,
        BillingModule,
        AccountModule,
        PaymentMethodsModule,
        NotificationsModule,
        AnalyticsModule,
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
