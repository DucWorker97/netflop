import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RailsService } from './rails.service';

@Controller('rails')
export class RailsController {
    constructor(private readonly railsService: RailsService) { }

    /**
     * GET /api/rails - Public: Get active rails for home screen
     */
    @Get()
    async findAll() {
        const rails = await this.railsService.findAll();
        return { data: rails };
    }

    /**
     * GET /api/rails/admin - Admin only: Get all rails including inactive
     */
    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async findAllAdmin() {
        const rails = await this.railsService.findAllAdmin();
        return { data: rails };
    }

    /**
     * GET /api/rails/:id - Get single rail
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const rail = await this.railsService.findOne(id);
        return { data: rail };
    }

    /**
     * POST /api/rails - Create new rail
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async create(
        @Body() dto: { name: string; type: string; genreId?: string; isActive?: boolean }
    ) {
        const rail = await this.railsService.create(dto);
        return { data: rail };
    }

    /**
     * PUT /api/rails/:id - Update rail
     */
    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: { name?: string; type?: string; genreId?: string | null; isActive?: boolean }
    ) {
        const rail = await this.railsService.update(id, dto);
        return { data: rail };
    }

    /**
     * PATCH /api/rails/reorder - Bulk update positions
     */
    @Patch('reorder')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async reorder(@Body() dto: { railIds: string[] }) {
        const rails = await this.railsService.reorder(dto);
        return { data: rails };
    }

    /**
     * DELETE /api/rails/:id - Delete rail
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        await this.railsService.delete(id);
        return { success: true };
    }

    /**
     * POST /api/rails/seed - Seed default rails (admin only)
     */
    @Post('seed')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async seed() {
        const result = await this.railsService.seedDefaultRails();
        return { data: result };
    }
}
