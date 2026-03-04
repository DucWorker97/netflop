import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ActorsService } from './actors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('actors')
export class ActorsController {
    constructor(private readonly actorsService: ActorsService) { }

    @Get()
    async findAll() {
        const actors = await this.actorsService.findAll();
        return { data: actors };
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const actor = await this.actorsService.findById(id);
        return { data: actor };
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async create(@Body() dto: { name: string; avatarUrl?: string }) {
        const actor = await this.actorsService.create(dto);
        return { data: actor };
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: { name?: string; avatarUrl?: string }
    ) {
        const actor = await this.actorsService.update(id, dto);
        return { data: actor };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.actorsService.delete(id);
        return { data: result };
    }
}
