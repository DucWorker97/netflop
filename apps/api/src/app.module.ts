import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module'
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

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// ─────────────────────────────────────────────────────────────
// Load and expand .env BEFORE NestJS module initialization
// This enables variable expansion like ${DEV_PUBLIC_HOST}
// ─────────────────────────────────────────────────────────────
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../../.env');
const env = dotenv.config({ path: envPath });
dotenvExpand.expand(env);

// Log expanded S3_PUBLIC_BASE_URL for debugging (mask sensitive parts)
console.log(`[env] Loaded from: ${envPath}`);
console.log(`[env] DEV_PUBLIC_HOST=${process.env.DEV_PUBLIC_HOST}`);
console.log(`[env] S3_PUBLIC_BASE_URL=${process.env.S3_PUBLIC_BASE_URL}`);
console.log(`[env] EXPO_PUBLIC_API_BASE_URL=${process.env.EXPO_PUBLIC_API_BASE_URL}`);

@Module({
    imports: [

        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['../../.env', '.env'],
        }),
        // Rate limiting - default global config
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000, // 1 second
                limit: 20, // 20 requests per second
            },
            {
                name: 'medium',
                ttl: 10000, // 10 seconds
                limit: 100, // 100 requests per 10 seconds
            },
            {
                name: 'long',
                ttl: 60000, // 1 minute
                limit: 300, // 300 requests per minute
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
export class AppModule { }
