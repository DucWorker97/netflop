
import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service'; // Kept as it's used
import { MovieStatus, EncodeStatus, User, Prisma } from '@prisma/client';
import { S3Client, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { ListMoviesDto, MovieSortField, SortOrder } from './dto/list-movies.dto';



@Injectable()
export class MoviesService {
    private s3Client: S3Client;
    private bucket: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private aiService: AiService,
    ) {
        this.bucket = this.configService.get<string>('S3_BUCKET') || 'netflop-media';
        this.s3Client = new S3Client({
            endpoint: this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000',
            region: this.configService.get<string>('S3_REGION') || 'us-east-1',
            credentials: {
                accessKeyId: this.configService.get<string>('S3_ACCESS_KEY') || 'minioadmin',
                secretAccessKey: this.configService.get<string>('S3_SECRET_KEY') || 'minioadmin',
            },
            forcePathStyle: true,
        });
    }

    async create(dto: CreateMovieDto) {
        // 1. Check for duplicate title (case-insensitive)
        const existingToken = await this.prisma.movie.findFirst({
            where: {
                title: {
                    equals: dto.title,
                    mode: 'insensitive',
                },
            },
        });

        if (existingToken) {
            throw new ConflictException({
                code: 'MOVIE_TITLE_EXISTS',
                message: `Movie with title "${dto.title}" already exists`,
            });
        }

        // 2. Handle Actors (Link existing or Create new)
        let actorOperations: Prisma.MovieActorCreateNestedManyWithoutMovieInput | undefined;
        if (dto.actors && dto.actors.length > 0) {
            const actorIds = await this.resolveActorIds(dto.actors);
            actorOperations = {
                create: actorIds.map((actorId) => ({
                    actor: { connect: { id: actorId } },
                })),
            };
        }

        // 3. Handle Genres
        let genreOperations: Prisma.MovieGenreCreateNestedManyWithoutMovieInput | undefined;
        if (dto.genreIds && dto.genreIds.length > 0) {
            genreOperations = {
                create: dto.genreIds.map((genreId) => ({
                    genre: { connect: { id: genreId } },
                })),
            };
        }

        return this.prisma.movie.create({
            data: {
                title: dto.title,
                description: dto.description,
                releaseYear: dto.releaseYear,
                durationSeconds: dto.durationSeconds,
                posterUrl: dto.posterUrl,
                backdropUrl: dto.backdropUrl,
                originalLanguage: dto.originalLanguage,
                trailerUrl: dto.trailerUrl,
                subtitleUrl: dto.subtitleUrl,
                movieStatus: MovieStatus.draft,
                encodeStatus: EncodeStatus.pending,
                actors: actorOperations,
                genres: genreOperations,
            },
            include: {
                genres: { include: { genre: true } },
                actors: { include: { actor: true } },
            },
        });
    }

    async findAll(query: ListMoviesDto, user?: User) {
        const {
            page = 1,
            limit = 20,
            q: search,
            genreId,
            sort = MovieSortField.createdAt,
            order = SortOrder.desc,
            status,
            yearFrom,
            yearTo,
            minRating,
            language,
        } = query;
        const skip = (page - 1) * limit;
        const where: Prisma.MovieWhereInput = {};

        if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
            throw new BadRequestException({
                code: 'INVALID_YEAR_RANGE',
                message: 'yearFrom cannot be greater than yearTo',
            });
        }

        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        if (genreId) {
            where.genres = {
                some: {
                    genreId,
                },
            };
        }

        if (yearFrom !== undefined || yearTo !== undefined) {
            where.releaseYear = {
                gte: yearFrom,
                lte: yearTo,
            };
        }

        if (minRating !== undefined) {
            where.voteAverage = {
                gte: minRating,
            };
        }

        if (language) {
            where.originalLanguage = {
                equals: language.trim(),
                mode: 'insensitive',
            };
        }

        const isAdmin = user?.role === 'admin';
        if (isAdmin) {
            if (status) {
                where.movieStatus = status;
            }
        } else {
            where.movieStatus = MovieStatus.published;
            where.encodeStatus = EncodeStatus.ready;
        }

        let orderBy: Prisma.MovieOrderByWithRelationInput = { createdAt: 'desc' };
        switch (sort) {
            case MovieSortField.title:
                orderBy = { title: order };
                break;
            case MovieSortField.releaseYear:
                orderBy = { releaseYear: order };
                break;
            case MovieSortField.voteAverage:
                orderBy = { voteAverage: order };
                break;
            case MovieSortField.popularity:
                orderBy = { popularity: order };
                break;
            case MovieSortField.createdAt:
            default:
                orderBy = { createdAt: order };
                break;
        }

        const [movies, total] = await Promise.all([
            this.prisma.movie.findMany({
                where,
                take: limit,
                skip,
                orderBy,
                include: {
                    genres: { include: { genre: true } },
                    actors: { include: { actor: true } },
                },
            }),
            this.prisma.movie.count({ where })
        ]);

        return { data: movies.map((m) => this.formatMovie(m)), total };
    }

    async findById(id: string, _user?: User) {
        const movie = await this.prisma.movie.findUnique({
            where: { id },
            include: {
                genres: { include: { genre: true } },
                actors: { include: { actor: true } },
            },
        });
        if (!movie) throw new NotFoundException('Movie not found');
        return this.formatMovie(movie);
    }

    async delete(id: string) {
        const movie = await this.prisma.movie.findUnique({ where: { id } });
        if (!movie) throw new NotFoundException('Movie not found');

        // Cleanup S3 files
        await this.cleanupMovieFiles(id);

        await this.prisma.movie.delete({ where: { id } });
        return { success: true };
    }

    // ... (existing findAll, findById, create)

    async update(id: string, dto: UpdateMovieDto) {
        const existing = await this.prisma.movie.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException({
                code: 'MOVIE_NOT_FOUND',
                message: 'Movie not found',
            });
        }

        // Handle genre updates
        if (dto.genreIds !== undefined) {
            await this.prisma.movieGenre.deleteMany({ where: { movieId: id } });
            if (dto.genreIds.length > 0) {
                await this.prisma.movieGenre.createMany({
                    data: dto.genreIds.map((genreId) => ({ movieId: id, genreId })),
                });
            }
        }

        // Handle actor updates
        if (dto.actors !== undefined) {
            // Remove existing relations
            await this.prisma.movieActor.deleteMany({ where: { movieId: id } });

            if (dto.actors.length > 0) {
                const actorIds = await this.resolveActorIds(dto.actors);
                // Create new relations
                await this.prisma.movieActor.createMany({
                    data: actorIds.map((actorId) => ({ movieId: id, actorId })),
                });
            }
        }

        const movie = await this.prisma.movie.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                releaseYear: dto.releaseYear,
                durationSeconds: dto.durationSeconds,
            },
            include: {
                genres: { include: { genre: true } },
                actors: { include: { actor: true } },
            },
        });

        // Trigger AI retrain for metadata update
        this.aiService.triggerRetrain().catch(err => console.warn('AI Retrain failed', err));

        return this.formatMovie(movie);
    }

    private async resolveActorIds(names: string[]): Promise<string[]> {
        const uniqueNames = [...new Set(names.filter(n => n.trim().length > 0))];
        if (uniqueNames.length === 0) return [];

        const existingActors = await this.prisma.actor.findMany({
            where: { name: { in: uniqueNames, mode: 'insensitive' } },
        });

        const existingNamesMap = new Set(existingActors.map((a) => a.name.toLowerCase()));
        const missingNames = uniqueNames.filter((n) => !existingNamesMap.has(n.toLowerCase()));

        // Create missing actors
        const newActors = await Promise.all(
            missingNames.map((name) => this.prisma.actor.create({ data: { name } }))
        );

        return [...existingActors, ...newActors].map((a) => a.id);
    }

    async publish(id: string, published: boolean) {
        const existing = await this.prisma.movie.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException({
                code: 'MOVIE_NOT_FOUND',
                message: 'Movie not found',
            });
        }

        const movie = await this.prisma.movie.update({
            where: { id },
            data: {
                movieStatus: published ? MovieStatus.published : MovieStatus.draft,
            },
            include: {
                genres: { include: { genre: true } },
            },
        });

        // Trigger AI retrain on publish status change
        this.aiService.triggerRetrain().catch(err => console.warn('AI Retrain failed', err));

        return this.formatMovie(movie);
    }

    async getStreamUrl(id: string, user: User) {
        const movie = await this.prisma.movie.findUnique({ where: { id } });
        if (!movie) {
            throw new NotFoundException({
                code: 'MOVIE_NOT_FOUND',
                message: 'Movie not found',
            });
        }

        // Only published + ready movies can be streamed
        if (movie.movieStatus !== MovieStatus.published || movie.encodeStatus !== EncodeStatus.ready) {
            throw new ForbiddenException({
                code: 'MOVIE_NOT_READY',
                message: 'Movie is not available for streaming',
            });
        }

        // Check Premium Access
        // @ts-ignore - isPremium might not yet be in generated client if migration failed
        if (movie.isPremium) {
            const subscription = await this.prisma.subscription.findUnique({
                where: { userId: user.id },
            });

            // Check if active (BASIC or PREMIUM)
            // @ts-ignore - PaymentStatus/SubscriptionStatus might be missing in client types
            if (!subscription || (subscription.status !== 'ACTIVE' && subscription.status !== 'PAST_DUE')) {
                throw new ForbiddenException({
                    code: 'PREMIUM_REQUIRED',
                    message: 'Premium subscription required',
                });
            }
        }

        const ttl = parseInt(this.configService.get<string>('STREAM_URL_TTL_SECONDS') || '3600', 10);
        // Requirement 2: Normalize prefix
        const rawPrefix = this.configService.get<string>('HLS_PREFIX') || 'hls';
        const prefix = rawPrefix.trim();

        // Requirement 3: Guard against whitespace
        const buildKey = (p: string, mId: string, suffix: string) => {
            const key = `${p}/${mId}/${suffix}`;
            if (key.match(/\s/) || key.includes('%20')) {
                console.warn(`[stream] Key malformed (contains whitespace): "${key}"`);
            }
            return key;
        };

        const masterKey = buildKey(prefix, id, 'master.m3u8');

        let playbackUrl: string;
        let qualityOptions: { name: string; url: string }[];
        let expiresAt: string | null = null;

        // Use S3_PUBLIC_BASE_URL for mobile compatibility (derived from DEV_PUBLIC_HOST)
        const s3PublicBaseUrl = this.configService.get<string>('S3_PUBLIC_BASE_URL');

        if (s3PublicBaseUrl) {
            // Public URL mode - mobile-friendly (no signature, uses DEV_PUBLIC_HOST)
            playbackUrl = `${s3PublicBaseUrl}/${masterKey}`;
            console.log(`[stream] Generated public playbackUrl: ${playbackUrl}`);

            const variants = [
                { name: '360p', suffix: 'v0/prog_index.m3u8' },
                { name: '480p', suffix: 'v1/prog_index.m3u8' },
                { name: '720p', suffix: 'v2/prog_index.m3u8' },
                { name: '1080p', suffix: 'v3/prog_index.m3u8' },
            ];

            qualityOptions = variants.map((v) => {
                const key = buildKey(prefix, id, v.suffix);
                return { name: v.name, url: `${s3PublicBaseUrl}/${key}` };
            });
        } else {
            // Fallback: Presigned URL mode
            const masterCommand = new GetObjectCommand({
                Bucket: this.bucket,
                Key: masterKey,
            });
            playbackUrl = await getSignedUrl(this.s3Client, masterCommand, { expiresIn: ttl });

            const variants = [
                { name: '360p', suffix: 'v0/prog_index.m3u8' },
                { name: '480p', suffix: 'v1/prog_index.m3u8' },
                { name: '720p', suffix: 'v2/prog_index.m3u8' },
                { name: '1080p', suffix: 'v3/prog_index.m3u8' },
            ];

            qualityOptions = await Promise.all(
                variants.map(async (v) => {
                    const key = buildKey(prefix, id, v.suffix);
                    const command = new GetObjectCommand({
                        Bucket: this.bucket,
                        Key: key,
                    });
                    const url = await getSignedUrl(this.s3Client, command, { expiresIn: ttl });
                    return { name: v.name, url };
                })
            );

            expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
        }

        return {
            playbackUrl,
            qualityOptions,
            expiresAt,
        };
    }

    async getProgress(movieId: string, userId: string) {
        const history = await this.prisma.watchHistory.findFirst({
            where: { userId, movieId },
        });

        if (!history) {
            return {
                progressSeconds: 0,
                durationSeconds: 0,
                completed: false,
                updatedAt: null,
            };
        }

        return {
            progressSeconds: history.progressSeconds,
            durationSeconds: history.durationSeconds,
            completed: history.completed,
            updatedAt: history.updatedAt.toISOString(),
        };
    }

    private formatMovie(movie: {
        id: string;
        title: string;
        description: string | null;
        posterUrl: string | null;
        backdropUrl: string | null;
        durationSeconds: number | null;
        releaseYear: number | null;
        movieStatus: MovieStatus;
        encodeStatus: EncodeStatus;
        createdAt: Date;
        updatedAt: Date;
        // TMDb fields
        tmdbId?: number | null;
        voteAverage?: number | null;
        voteCount?: number | null;
        popularity?: number | null;
        originalLanguage?: string | null;
        trailerUrl?: string | null;
        subtitleUrl?: string | null;
        genres?: { genre: { id: string; name: string; slug: string } }[];
        actors?: { actor: { id: string; name: string; avatarUrl: string | null } }[];
    }) {
        return {
            id: movie.id,
            title: movie.title,
            description: movie.description,
            posterUrl: movie.posterUrl,
            backdropUrl: movie.backdropUrl,
            durationSeconds: movie.durationSeconds,
            releaseYear: movie.releaseYear,
            movieStatus: movie.movieStatus,
            encodeStatus: movie.encodeStatus,
            genres: movie.genres?.map((mg) => ({
                id: mg.genre.id,
                name: mg.genre.name,
                slug: mg.genre.slug,
            })) || [],
            actors: movie.actors?.map((ma) => ({
                id: ma.actor.id,
                name: ma.actor.name,
                avatarUrl: ma.actor.avatarUrl,
            })) || [],
            // TMDb fields
            tmdbId: movie.tmdbId || null,
            voteAverage: movie.voteAverage || null,
            voteCount: movie.voteCount || null,
            popularity: movie.popularity || null,
            originalLanguage: movie.originalLanguage || null,
            trailerUrl: movie.trailerUrl || null,
            subtitleUrl: movie.subtitleUrl || null,
            createdAt: movie.createdAt.toISOString(),
            updatedAt: movie.updatedAt.toISOString(),
        };
    }

    private async cleanupMovieFiles(movieId: string) {
        const prefixes = [
            `originals/${movieId}/`,
            `hls/${movieId}/`,
            `posters/${movieId}/`,
            `subtitles/${movieId}/`
        ];

        for (const prefix of prefixes) {
            await this.deleteFolder(prefix);
        }
    }

    private async deleteFolder(prefix: string) {
        let continuationToken: string | undefined;
        do {
            const listCommand = new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            });
            const listResult = await this.s3Client.send(listCommand);

            if (listResult.Contents && listResult.Contents.length > 0) {
                const deleteCommand = new DeleteObjectsCommand({
                    Bucket: this.bucket,
                    Delete: {
                        Objects: listResult.Contents.map((obj) => ({ Key: obj.Key })),
                        Quiet: true,
                    },
                });
                await this.s3Client.send(deleteCommand);
            }

            continuationToken = listResult.NextContinuationToken;
        } while (continuationToken);
    }
}
