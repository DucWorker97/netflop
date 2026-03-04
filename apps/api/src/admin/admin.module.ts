import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        BullModule.registerQueue({ name: 'encode' }),
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
