/**
 * BOLA Regression Test Suite
 * 
 * Tests for OWASP API1:2023 - Broken Object Level Authorization
 * Verifies that users cannot access resources they don't own or aren't authorized to see.
 * 
 * Test Coverage:
 * 1. User A cannot access User B's favorites
 * 2. User A cannot access User B's watch history
 * 3. User A cannot access User B's profile
 * 4. Viewer cannot read draft movies
 * 5. Viewer cannot stream non-ready movies
 * 6. Viewer cannot call admin endpoints
 * 7. Viewer cannot rate unpublished movies
 * 8. Profile ID spoofing is blocked
 * 9. ID tampering returns 403
 * 10. Admin can access any resource
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

describe('BOLA Regression Tests (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let jwtService: JwtService;

    // Test data
    let userA: { id: string; email: string; token: string };
    let userB: { id: string; email: string; token: string };
    let adminUser: { id: string; email: string; token: string };
    let draftMovie: { id: string };
    let publishedMovie: { id: string };
    let userBProfile: { id: string };
    let userBFavorite: { id: string };
    let userBWatchHistory: { id: string };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        jwtService = moduleFixture.get<JwtService>(JwtService);

        // Create test users
        const passwordHash = '$2b$10$examplehashfortest'; // Bcrypt hash

        userA = {
            id: uuidv4(),
            email: `user-a-${Date.now()}@test.com`,
            token: '',
        };
        await prisma.user.create({
            data: { id: userA.id, email: userA.email, passwordHash, role: 'viewer' },
        });
        userA.token = jwtService.sign({ sub: userA.id, role: 'viewer' });

        userB = {
            id: uuidv4(),
            email: `user-b-${Date.now()}@test.com`,
            token: '',
        };
        await prisma.user.create({
            data: { id: userB.id, email: userB.email, passwordHash, role: 'viewer' },
        });
        userB.token = jwtService.sign({ sub: userB.id, role: 'viewer' });

        adminUser = {
            id: uuidv4(),
            email: `admin-${Date.now()}@test.com`,
            token: '',
        };
        await prisma.user.create({
            data: { id: adminUser.id, email: adminUser.email, passwordHash, role: 'admin' },
        });
        adminUser.token = jwtService.sign({ sub: adminUser.id, role: 'admin' });

        // Create draft movie (not visible to viewers)
        draftMovie = await prisma.movie.create({
            data: {
                id: uuidv4(),
                title: 'BOLA Test Draft Movie',
                movieStatus: 'draft',
                encodeStatus: 'pending',
            },
        });

        // Create published + ready movie (visible to all)
        publishedMovie = await prisma.movie.create({
            data: {
                id: uuidv4(),
                title: 'BOLA Test Published Movie',
                movieStatus: 'published',
                encodeStatus: 'ready',
                durationSeconds: 3600,
            },
        });

        // Create User B's profile
        userBProfile = await prisma.profile.create({
            data: {
                id: uuidv4(),
                userId: userB.id,
                name: 'User B Profile',
            },
        });

        // Create User B's favorite
        userBFavorite = await prisma.favorite.create({
            data: {
                id: uuidv4(),
                userId: userB.id,
                movieId: publishedMovie.id,
            },
        });

        // Create User B's watch history
        userBWatchHistory = await prisma.watchHistory.create({
            data: {
                id: uuidv4(),
                userId: userB.id,
                movieId: publishedMovie.id,
                progressSeconds: 1800,
                durationSeconds: 3600,
                completed: false,
            },
        });
    });

    afterAll(async () => {
        // Cleanup test data
        await prisma.watchHistory.deleteMany({
            where: { userId: { in: [userA.id, userB.id] } },
        });
        await prisma.favorite.deleteMany({
            where: { userId: { in: [userA.id, userB.id] } },
        });
        await prisma.profile.deleteMany({
            where: { userId: { in: [userA.id, userB.id] } },
        });
        await prisma.movie.deleteMany({
            where: { id: { in: [draftMovie.id, publishedMovie.id] } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: [userA.id, userB.id, adminUser.id] } },
        });
        await app.close();
    });

    // ==========================================
    // Test 1: User A cannot access User B's favorites
    // ==========================================
    describe('Favorites BOLA', () => {
        it('should not allow User A to see User B favorites via profile ID spoofing', async () => {
            const response = await request(app.getHttpServer())
                .get('/favorites')
                .set('Authorization', `Bearer ${userA.token}`)
                .set('x-profile-id', userBProfile.id) // Spoofing User B's profile
                .expect(403);

            expect(response.body.code || response.body.error?.code).toBe('INVALID_PROFILE');
        });

        it('should allow User A to see only their own favorites', async () => {
            const response = await request(app.getHttpServer())
                .get('/favorites')
                .set('Authorization', `Bearer ${userA.token}`)
                .expect(200);

            // Should not contain User B's favorites
            const favoriteIds = response.body.data.map((f: any) => f.id);
            expect(favoriteIds).not.toContain(userBFavorite.id);
        });
    });

    // ==========================================
    // Test 2: User A cannot access User B's watch history
    // ==========================================
    describe('Watch History BOLA', () => {
        it('should not allow User A to access User B history via profile ID spoofing', async () => {
            const response = await request(app.getHttpServer())
                .get('/history')
                .set('Authorization', `Bearer ${userA.token}`)
                .set('x-profile-id', userBProfile.id)
                .expect(403);

            expect(response.body.code || response.body.error?.code).toBe('INVALID_PROFILE');
        });
    });

    // ==========================================
    // Test 3: User A cannot access User B's profile
    // ==========================================
    describe('Profile BOLA', () => {
        it('should not allow User A to read User B profile', async () => {
            await request(app.getHttpServer())
                .get(`/api/profiles/${userBProfile.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .expect(403);
        });

        it('should not allow User A to update User B profile', async () => {
            await request(app.getHttpServer())
                .put(`/api/profiles/${userBProfile.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .send({ name: 'Hacked Name' })
                .expect(403);
        });

        it('should not allow User A to delete User B profile', async () => {
            await request(app.getHttpServer())
                .delete(`/api/profiles/${userBProfile.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .expect(403);
        });
    });

    // ==========================================
    // Test 4: Viewer cannot read draft movies
    // ==========================================
    describe('Movie Visibility BOLA', () => {
        it('should not allow viewer to read draft movie details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/movies/${draftMovie.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .expect(403);

            expect(response.body.code || response.body.error?.code).toBe('MOVIE_NOT_AVAILABLE');
        });

        it('should allow admin to read draft movie details', async () => {
            await request(app.getHttpServer())
                .get(`/movies/${draftMovie.id}`)
                .set('Authorization', `Bearer ${adminUser.token}`)
                .expect(200);
        });

        it('should allow viewer to read published+ready movie', async () => {
            await request(app.getHttpServer())
                .get(`/movies/${publishedMovie.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .expect(200);
        });
    });

    // ==========================================
    // Test 5: Viewer cannot stream non-ready movies
    // ==========================================
    describe('Stream URL BOLA', () => {
        it('should not allow viewer to get stream URL for draft movie', async () => {
            const response = await request(app.getHttpServer())
                .get(`/movies/${draftMovie.id}/stream`)
                .set('Authorization', `Bearer ${userA.token}`)
                .expect(403);

            // Could be MOVIE_NOT_AVAILABLE or MOVIE_NOT_READY depending on implementation
            expect(['MOVIE_NOT_AVAILABLE', 'MOVIE_NOT_READY']).toContain(
                response.body.code || response.body.error?.code
            );
        });
    });

    // ==========================================
    // Test 6: Viewer cannot call admin endpoints
    // ==========================================
    describe('Admin Endpoints BOLA', () => {
        it('should not allow viewer to create movie', async () => {
            await request(app.getHttpServer())
                .post('/movies')
                .set('Authorization', `Bearer ${userA.token}`)
                .send({ title: 'Hacked Movie', releaseYear: 2024 })
                .expect(403);
        });

        it('should not allow viewer to update movie', async () => {
            await request(app.getHttpServer())
                .put(`/movies/${publishedMovie.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .send({ title: 'Hacked Title' })
                .expect(403);
        });

        it('should not allow viewer to delete movie', async () => {
            await request(app.getHttpServer())
                .delete(`/movies/${publishedMovie.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .expect(403);
        });

        it('should not allow viewer to publish movie', async () => {
            await request(app.getHttpServer())
                .patch(`/movies/${draftMovie.id}/publish`)
                .set('Authorization', `Bearer ${userA.token}`)
                .send({ published: true })
                .expect(403);
        });

        it('should not allow viewer to access upload presigned URL', async () => {
            await request(app.getHttpServer())
                .get('/upload/presigned-url')
                .query({ movieId: publishedMovie.id, fileName: 'test.mp4', contentType: 'video/mp4', sizeBytes: '1000' })
                .set('Authorization', `Bearer ${userA.token}`)
                .expect(403);
        });
    });

    // ==========================================
    // Test 7: Viewer cannot rate unpublished movies
    // ==========================================
    describe('Ratings BOLA', () => {
        it('should not allow viewer to rate draft movie', async () => {
            const response = await request(app.getHttpServer())
                .post(`/ratings/${draftMovie.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .send({ rating: 5 })
                .expect(403);

            expect(response.body.code || response.body.error?.code).toBe('MOVIE_NOT_AVAILABLE');
        });

        it('should allow viewer to rate published movie', async () => {
            await request(app.getHttpServer())
                .post(`/ratings/${publishedMovie.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .send({ rating: 4 })
                .expect(201);
        });

        it('should not allow getting stats for draft movie', async () => {
            await request(app.getHttpServer())
                .get(`/ratings/${draftMovie.id}/stats`)
                .expect(403);
        });
    });

    // ==========================================
    // Test 8: Admin can access any resource
    // ==========================================
    describe('Admin Override', () => {
        it('should allow admin to read any user profile', async () => {
            await request(app.getHttpServer())
                .get(`/api/profiles/${userBProfile.id}`)
                .set('Authorization', `Bearer ${adminUser.token}`)
                .expect(200);
        });

        it('should allow admin to read draft movie', async () => {
            await request(app.getHttpServer())
                .get(`/movies/${draftMovie.id}`)
                .set('Authorization', `Bearer ${adminUser.token}`)
                .expect(200);
        });
    });

    // ==========================================
    // Test 9: ID tampering returns 403 not 404
    // ==========================================
    describe('ID Tampering Response', () => {
        it('should return 403 for unauthorized profile access (not 404)', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/profiles/${userBProfile.id}`)
                .set('Authorization', `Bearer ${userA.token}`);

            expect(response.status).toBe(403);
            // Should NOT be 404 - that would leak existence information
        });
    });

    // ==========================================
    // Test 10: Unauthenticated requests
    // ==========================================
    describe('Authentication Required', () => {
        it('should return 401 for protected endpoints without token', async () => {
            await request(app.getHttpServer())
                .get('/favorites')
                .expect(401);
        });

        it('should return 401 for movie detail without token', async () => {
            await request(app.getHttpServer())
                .get(`/movies/${publishedMovie.id}`)
                .expect(401);
        });
    });
});
