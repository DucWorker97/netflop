import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
    imports: [
        BullModule.registerQueueAsync({
            name: 'encode',
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_URL')?.replace('redis://', '').split(':')[0] || 'localhost',
                    port: parseInt(configService.get<string>('REDIS_URL')?.split(':')[2] || '6379', 10),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [UploadController],
    providers: [UploadService],
    exports: [UploadService],
})
export class UploadModule { }
