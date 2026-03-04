import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateRailDto {
    name: string;
    type: string;
    genreId?: string;
    position?: number;
    isActive?: boolean;
}

interface UpdateRailDto {
    name?: string;
    type?: string;
    genreId?: string | null;
    position?: number;
    isActive?: boolean;
}

interface ReorderDto {
    railIds: string[];
}

@Injectable()
export class RailsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.railConfig.findMany({
            where: { isActive: true },
            include: {
                genre: {
                    select: { id: true, name: true, slug: true },
                },
            },
            orderBy: { position: 'asc' },
        });
    }

    async findAllAdmin() {
        return this.prisma.railConfig.findMany({
            include: {
                genre: {
                    select: { id: true, name: true, slug: true },
                },
            },
            orderBy: { position: 'asc' },
        });
    }

    async findOne(id: string) {
        const rail = await this.prisma.railConfig.findUnique({
            where: { id },
            include: {
                genre: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });

        if (!rail) {
            throw new NotFoundException({
                code: 'RAIL_NOT_FOUND',
                message: 'Rail configuration not found',
            });
        }

        return rail;
    }

    async create(dto: CreateRailDto) {
        // Get max position
        const maxPositionRail = await this.prisma.railConfig.findFirst({
            orderBy: { position: 'desc' },
        });
        const nextPosition = (maxPositionRail?.position ?? -1) + 1;

        return this.prisma.railConfig.create({
            data: {
                name: dto.name,
                type: dto.type,
                genreId: dto.genreId || null,
                position: dto.position ?? nextPosition,
                isActive: dto.isActive ?? true,
            },
            include: {
                genre: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });
    }

    async update(id: string, dto: UpdateRailDto) {
        await this.findOne(id); // Ensure exists

        return this.prisma.railConfig.update({
            where: { id },
            data: {
                name: dto.name,
                type: dto.type,
                genreId: dto.genreId,
                position: dto.position,
                isActive: dto.isActive,
            },
            include: {
                genre: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });
    }

    async reorder(dto: ReorderDto) {
        const updates = dto.railIds.map((id, index) =>
            this.prisma.railConfig.update({
                where: { id },
                data: { position: index },
            })
        );

        await this.prisma.$transaction(updates);

        return this.findAllAdmin();
    }

    async delete(id: string) {
        await this.findOne(id); // Ensure exists

        await this.prisma.railConfig.delete({
            where: { id },
        });

        return { success: true };
    }

    async seedDefaultRails() {
        const existing = await this.prisma.railConfig.count();
        if (existing > 0) return { message: 'Rails already seeded' };

        // Get genres for default rails
        const genres = await this.prisma.genre.findMany({ take: 5 });

        const defaultRails = [
            { name: 'Continue Watching', type: 'continue_watching', position: 0 },
            { name: 'For You', type: 'for_you', position: 1 },
            { name: 'Trending Now', type: 'trending', position: 2 },
            { name: 'Recently Added', type: 'recent', position: 3 },
            ...genres.map((g: typeof genres[number], i: number) => ({
                name: g.name,
                type: 'genre',
                genreId: g.id,
                position: 4 + i,
            })),
        ];

        await this.prisma.railConfig.createMany({
            data: defaultRails,
        });

        return { message: 'Default rails seeded successfully', count: defaultRails.length };
    }
}
