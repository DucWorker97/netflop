import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PolicyGuard } from './guards/policy.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * CommonModule - Provides shared guards and utilities
 * 
 * Exports PolicyGuard and RolesGuard for use across the application.
 * Guards are not global - they are applied per-route via @UseGuards.
 */
@Global()
@Module({
    imports: [PrismaModule],
    providers: [PolicyGuard, RolesGuard],
    exports: [PolicyGuard, RolesGuard],
})
export class CommonModule { }
