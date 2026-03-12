import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

interface MoviesResponseBody {
    data: Array<{
        id: string;
        title: string;
        movieStatus: 'draft' | 'published';
        encodeStatus: 'pending' | 'processing' | 'ready' | 'failed';
        releaseYear: number | null;
    }>;
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

describe('History Delete + Movies Filters (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let jwtService: JwtService;

    const unique = Date.now();
    const titlePrefix = `FilterTest-${unique}`;

    let viewerUser: { id: string; token: string };
    let adminUser: { id: string; token: string };

    let actionGenreId: string;
    let comedyGenreId: string;

    let draftMovieId: string;
    let publishedReadyActionMovieId: string;
    let publishedReadyComedyMovieId: string;
    let publishedPendingMovieId: string;

    const seedViewerHistory = async () => {
        await prisma.watchHistory.deleteMany({ where: { userId: viewerUser.id } });
        await prisma.watchHistory.createMany({
            data: [
                {
                    id: uuidv4(),
                    userId: viewerUser.id,
                    movieId: publishedReadyActionMovieId,
                    progressSeconds: 700,
                    durationSeconds: 3600,
                    completed: false,
                },
                {
                    id: uuidv4(),
                    userId: viewerUser.id,
                    movieId: publishedReadyComedyMovieId,
                    progressSeconds: 1200,
                    durationSeconds: 3200,
                    completed: false,
                },
            ],
        });
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        jwtService = moduleFixture.get<JwtService>(JwtService);

        const passwordHash = '$2b$10$examplehashfortest';

        viewerUser = { id: uuidv4(), token: '' };
        await prisma.user.create({
            data: {
                id: viewerUser.id,
                email: `viewer-${unique}@test.com`,
                passwordHash,
                role: 'viewer',
            },
        });
        viewerUser.token = jwtService.sign({ sub: viewerUser.id, role: 'viewer' });

        adminUser = { id: uuidv4(), token: '' };
        await prisma.user.create({
            data: {
                id: adminUser.id,
                email: `admin-${unique}@test.com`,
                passwordHash,
                role: 'admin',
            },
        });
        adminUser.token = jwtService.sign({ sub: adminUser.id, role: 'admin' });

        const actionGenre = await prisma.genre.create({
            data: {
                id: uuidv4(),
                name: `Action-${unique}`,
                slug: `action-${unique}`,
            },
        });
        actionGenreId = actionGenre.id;

        const comedyGenre = await prisma.genre.create({
            data: {
                id: uuidv4(),
                name: `Comedy-${unique}`,
                slug: `comedy-${unique}`,
            },
        });
        comedyGenreId = comedyGenre.id;

        const draftMovie = await prisma.movie.create({
            data: {
                id: uuidv4(),
                title: `${titlePrefix}-Draft`,
                movieStatus: 'draft',
                encodeStatus: 'ready',
                releaseYear: 2023,
                voteAverage: 7.5,
                originalLanguage: 'en',
            },
        });
        draftMovieId = draftMovie.id;

        const publishedReadyActionMovie = await prisma.movie.create({
            data: {
                id: uuidv4(),
                title: `${titlePrefix}-Action`,
                movieStatus: 'published',
                encodeStatus: 'ready',
                releaseYear: 2024,
                voteAverage: 8.7,
                originalLanguage: 'en',
            },
        });
        publishedReadyActionMovieId = publishedReadyActionMovie.id;

        const publishedReadyComedyMovie = await prisma.movie.create({
            data: {
                id: uuidv4(),
                title: `${titlePrefix}-Comedy`,
                movieStatus: 'published',
                encodeStatus: 'ready',
                releaseYear: 2018,
                voteAverage: 6.4,
                originalLanguage: 'vi',
            },
        });
        publishedReadyComedyMovieId = publishedReadyComedyMovie.id;

        const publishedPendingMovie = await prisma.movie.create({
            data: {
                id: uuidv4(),
                title: `${titlePrefix}-Pending`,
                movieStatus: 'published',
                encodeStatus: 'pending',
                releaseYear: 2022,
                voteAverage: 9.1,
                originalLanguage: 'en',
            },
        });
        publishedPendingMovieId = publishedPendingMovie.id;

        await prisma.movieGenre.createMany({
            data: [
                { movieId: publishedReadyActionMovieId, genreId: actionGenreId },
                { movieId: publishedReadyComedyMovieId, genreId: comedyGenreId },
                { movieId: publishedPendingMovieId, genreId: actionGenreId },
            ],
        });
    });

    beforeEach(async () => {
        await seedViewerHistory();
    });

    afterAll(async () => {
        await prisma.watchHistory.deleteMany({
            where: { userId: { in: [viewerUser.id, adminUser.id] } },
        });
        await prisma.movieGenre.deleteMany({
            where: {
                movieId: {
                    in: [
                        draftMovieId,
                        publishedReadyActionMovieId,
                        publishedReadyComedyMovieId,
                        publishedPendingMovieId,
                    ],
                },
            },
        });
        await prisma.movie.deleteMany({
            where: {
                id: {
                    in: [
                        draftMovieId,
                        publishedReadyActionMovieId,
                        publishedReadyComedyMovieId,
                        publishedPendingMovieId,
                    ],
                },
            },
        });
        await prisma.genre.deleteMany({
            where: { id: { in: [actionGenreId, comedyGenreId] } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: [viewerUser.id, adminUser.id] } },
        });
        await app.close();
    });

    describe('DELETE /history', () => {
        it('deletes a single history item via DELETE /history/:movieId', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/history/${publishedReadyActionMovieId}`)
                .set('Authorization', `Bearer ${viewerUser.token}`)
                .expect(200);

            expect(response.body.data.deleted).toBe(1);

            const deletedItem = await prisma.watchHistory.findFirst({
                where: { userId: viewerUser.id, movieId: publishedReadyActionMovieId },
            });
            expect(deletedItem).toBeNull();

            const remaining = await prisma.watchHistory.count({
                where: { userId: viewerUser.id },
            });
            expect(remaining).toBe(1);
        });

        it('clears all user history via DELETE /history', async () => {
            const response = await request(app.getHttpServer())
                .delete('/history')
                .set('Authorization', `Bearer ${viewerUser.token}`)
                .expect(200);

            expect(response.body.data.deleted).toBe(2);

            const remaining = await prisma.watchHistory.count({
                where: { userId: viewerUser.id },
            });
            expect(remaining).toBe(0);
        });
    });

    describe('GET /movies filters', () => {
        it('enforces public catalog visibility to published+ready only', async () => {
            const response = await request(app.getHttpServer())
                .get(`/movies?q=${encodeURIComponent(titlePrefix)}&status=draft`)
                .expect(200);

            const body = response.body as MoviesResponseBody;
            const ids = body.data.map((movie) => movie.id);

            expect(ids).toContain(publishedReadyActionMovieId);
            expect(ids).toContain(publishedReadyComedyMovieId);
            expect(ids).not.toContain(draftMovieId);
            expect(ids).not.toContain(publishedPendingMovieId);

            body.data.forEach((movie) => {
                expect(movie.movieStatus).toBe('published');
                expect(movie.encodeStatus).toBe('ready');
            });
        });

        it('allows admin to filter by draft status', async () => {
            const response = await request(app.getHttpServer())
                .get(`/movies?q=${encodeURIComponent(titlePrefix)}&status=draft`)
                .set('Authorization', `Bearer ${adminUser.token}`)
                .expect(200);

            const body = response.body as MoviesResponseBody;
            const ids = body.data.map((movie) => movie.id);

            expect(ids).toContain(draftMovieId);
            expect(ids).not.toContain(publishedReadyActionMovieId);
        });

        it('supports genre + year + rating + language filters', async () => {
            const response = await request(app.getHttpServer())
                .get(`/movies?q=${encodeURIComponent(titlePrefix)}&genreId=${actionGenreId}&yearFrom=2023&yearTo=2025&minRating=8&language=en`)
                .set('Authorization', `Bearer ${adminUser.token}`)
                .expect(200);

            const body = response.body as MoviesResponseBody;
            const ids = body.data.map((movie) => movie.id);

            expect(ids).toContain(publishedReadyActionMovieId);
            expect(ids).not.toContain(publishedReadyComedyMovieId);
        });

        it('supports sort/order correctly', async () => {
            const response = await request(app.getHttpServer())
                .get(`/movies?q=${encodeURIComponent(titlePrefix)}&status=published&sort=releaseYear&order=asc`)
                .set('Authorization', `Bearer ${adminUser.token}`)
                .expect(200);

            const body = response.body as MoviesResponseBody;
            const sortedIds = body.data.map((movie) => movie.id);

            const comedyIndex = sortedIds.indexOf(publishedReadyComedyMovieId);
            const pendingIndex = sortedIds.indexOf(publishedPendingMovieId);
            const actionIndex = sortedIds.indexOf(publishedReadyActionMovieId);

            expect(comedyIndex).toBeGreaterThanOrEqual(0);
            expect(pendingIndex).toBeGreaterThanOrEqual(0);
            expect(actionIndex).toBeGreaterThanOrEqual(0);
            expect(comedyIndex).toBeLessThan(pendingIndex);
            expect(pendingIndex).toBeLessThan(actionIndex);
        });

        it('returns 400 for invalid year range', async () => {
            const response = await request(app.getHttpServer())
                .get('/movies?yearFrom=2026&yearTo=2020')
                .set('Authorization', `Bearer ${adminUser.token}`)
                .expect(400);

            const code = (response.body.error?.code as string | undefined) ?? (response.body.code as string | undefined);
            expect(code).toBe('INVALID_YEAR_RANGE');
        });
    });
});
