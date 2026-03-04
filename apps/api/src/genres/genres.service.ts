import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GenresService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const genres = await this.prisma.genre.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { movies: true }
                }
            }
        });

        return genres.map((genre: typeof genres[number]) => ({
            id: genre.id,
            name: genre.name,
            slug: genre.slug,
            movieCount: genre._count.movies,
        }));
    }

    async findById(id: string) {
        const genre = await this.prisma.genre.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { movies: true }
                }
            }
        });

        if (!genre) {
            throw new NotFoundException({
                code: 'GENRE_NOT_FOUND',
                message: 'Genre not found',
            });
        }

        return {
            id: genre.id,
            name: genre.name,
            slug: genre.slug,
            movieCount: genre._count.movies,
        };
    }

    async create(data: { name: string; slug?: string }) {
        const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Check if slug already exists
        const existing = await this.prisma.genre.findUnique({
            where: { slug }
        });

        if (existing) {
            throw new ConflictException({
                code: 'GENRE_SLUG_EXISTS',
                message: 'A genre with this slug already exists',
            });
        }

        const genre = await this.prisma.genre.create({
            data: {
                name: data.name,
                slug,
            },
        });

        return {
            id: genre.id,
            name: genre.name,
            slug: genre.slug,
            movieCount: 0,
        };
    }

    async update(id: string, data: { name?: string; slug?: string }) {
        // Check if genre exists
        const existing = await this.prisma.genre.findUnique({
            where: { id }
        });

        if (!existing) {
            throw new NotFoundException({
                code: 'GENRE_NOT_FOUND',
                message: 'Genre not found',
            });
        }

        // If updating slug, check for conflicts
        if (data.slug && data.slug !== existing.slug) {
            const conflict = await this.prisma.genre.findUnique({
                where: { slug: data.slug }
            });

            if (conflict) {
                throw new ConflictException({
                    code: 'GENRE_SLUG_EXISTS',
                    message: 'A genre with this slug already exists',
                });
            }
        }

        const genre = await this.prisma.genre.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.slug && { slug: data.slug }),
            },
            include: {
                _count: {
                    select: { movies: true }
                }
            }
        });

        return {
            id: genre.id,
            name: genre.name,
            slug: genre.slug,
            movieCount: genre._count.movies,
        };
    }

    async delete(id: string) {
        // Check if genre exists
        const existing = await this.prisma.genre.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { movies: true }
                }
            }
        });

        if (!existing) {
            throw new NotFoundException({
                code: 'GENRE_NOT_FOUND',
                message: 'Genre not found',
            });
        }

        // Remove genre associations first (many-to-many)
        await this.prisma.movieGenre.deleteMany({
            where: { genreId: id }
        });

        // Delete the genre
        await this.prisma.genre.delete({
            where: { id }
        });

        return { deleted: true, id };
    }
}
