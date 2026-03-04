import { Module } from '@nestjs/common';
import { RailsController } from './rails.controller';
import { RailsService } from './rails.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RailsController],
    providers: [RailsService],
    exports: [RailsService],
})
export class RailsModule { }
