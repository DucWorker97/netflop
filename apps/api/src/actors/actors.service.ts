import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActorsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const actors = await this.prisma.actor.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { movies: true }
                }
            }
        });

        return actors.map((actor: typeof actors[number]) => ({
            id: actor.id,
            name: actor.name,
            avatarUrl: actor.avatarUrl,
            movieCount: actor._count.movies,
        }));
    }

    async findById(id: string) {
        const actor = await this.prisma.actor.findUnique({
            where: { id },
            include: {
                movies: {
                    include: {
                        movie: {
                            include: {
                                genres: {
                                    include: { genre: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!actor) {
            throw new NotFoundException({
                code: 'ACTOR_NOT_FOUND',
                message: 'Actor not found',
            });
        }

        return {
            id: actor.id,
            name: actor.name,
            avatarUrl: actor.avatarUrl,
            movies: actor.movies.map((ma: typeof actor.movies[number]) => ({
                id: ma.movie.id,
                title: ma.movie.title,
                posterUrl: ma.movie.posterUrl,
                releaseYear: ma.movie.releaseYear,
                role: ma.role,
                genres: ma.movie.genres.map((g: typeof ma.movie.genres[number]) => ({
                    id: g.genre.id,
                    name: g.genre.name,
                    slug: g.genre.slug,
                })),
            })),
        };
    }

    async findByMovieId(movieId: string) {
        const movieActors = await this.prisma.movieActor.findMany({
            where: { movieId },
            include: {
                actor: true
            },
            orderBy: {
                actor: { name: 'asc' }
            }
        });

        return movieActors.map((ma: typeof movieActors[number]) => ({
            id: ma.actor.id,
            name: ma.actor.name,
            avatarUrl: ma.actor.avatarUrl,
            role: ma.role,
        }));
    }

    async create(data: { name: string; avatarUrl?: string }) {
        const actor = await this.prisma.actor.create({
            data: {
                name: data.name,
                avatarUrl: data.avatarUrl,
            },
        });

        return {
            id: actor.id,
            name: actor.name,
            avatarUrl: actor.avatarUrl,
            movieCount: 0,
        };
    }

    async update(id: string, data: { name?: string; avatarUrl?: string }) {
        const existing = await this.prisma.actor.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException({
                code: 'ACTOR_NOT_FOUND',
                message: 'Actor not found',
            });
        }

        const actor = await this.prisma.actor.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
            },
        });

        return {
            id: actor.id,
            name: actor.name,
            avatarUrl: actor.avatarUrl,
        };
    }

    async delete(id: string) {
        const existing = await this.prisma.actor.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException({
                code: 'ACTOR_NOT_FOUND',
                message: 'Actor not found',
            });
        }

        await this.prisma.actor.delete({ where: { id } });
        return { deleted: true, id };
    }
}
