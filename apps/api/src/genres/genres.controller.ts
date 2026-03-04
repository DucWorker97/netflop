import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { GenresService } from './genres.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('genres')
export class GenresController {
    constructor(private readonly genresService: GenresService) { }

    @Get()
    async findAll() {
        const genres = await this.genresService.findAll();
        return { data: genres };
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const genre = await this.genresService.findById(id);
        return { data: genre };
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async create(@Body() dto: { name: string; slug?: string }) {
        const genre = await this.genresService.create(dto);
        return { data: genre };
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: { name?: string; slug?: string }
    ) {
        const genre = await this.genresService.update(id, dto);
        return { data: genre };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.genresService.delete(id);
        return { data: result };
    }
}
