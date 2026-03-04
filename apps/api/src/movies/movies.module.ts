import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';

import { AiModule } from '../ai/ai.module';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [AiModule, UploadModule],
    controllers: [MoviesController],
    providers: [MoviesService],
    exports: [MoviesService],
})
export class MoviesModule { }
