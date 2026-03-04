import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    @Get()
    async check() {
        try {
            // Check DB
            await this.prisma.$queryRaw`SELECT 1`;

            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'up',
                    api: 'up'
                },
                version: process.env.npm_package_version || '0.0.1'
            };
        } catch (error) {
            throw new ServiceUnavailableException({
                status: 'error',
                services: {
                    database: 'down',
                    api: 'up'
                },
                message: (error as any).message
            });
        }
    }
}
