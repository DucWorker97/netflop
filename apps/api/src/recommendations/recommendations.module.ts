/**
 * Recommendations Module
 * Integrates with AI Curator Python service
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
    imports: [
        HttpModule.register({
            timeout: 10000,
            maxRedirects: 3,
        }),
    ],
    controllers: [RecommendationsController],
    providers: [RecommendationsService],
    exports: [RecommendationsService],
})
export class RecommendationsModule { }
