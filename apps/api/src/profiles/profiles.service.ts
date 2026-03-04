import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MaturityRating } from '@prisma/client';
import * as bcrypt from 'bcrypt';

interface CreateProfileDto {
    name: string;
    avatarUrl?: string;
    isKids?: boolean;
    maxRating?: string;
    pin?: string;
}

interface UpdateProfileDto {
    name?: string;
    avatarUrl?: string;
    isKids?: boolean;
    maxRating?: string;
    pin?: string;
    pinEnabled?: boolean;
}

@Injectable()
export class ProfilesService {
    constructor(private prisma: PrismaService) { }

    // Maximum profiles per user
    private readonly MAX_PROFILES = 5;

    async findByUser(userId: string) {
        return this.prisma.profile.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: string, userId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id },
        });

        if (!profile) {
            throw new NotFoundException({
                code: 'PROFILE_NOT_FOUND',
                message: 'Profile not found',
            });
        }

        if (profile.userId !== userId) {
            throw new ForbiddenException({
                code: 'PROFILE_ACCESS_DENIED',
                message: 'You do not have access to this profile',
            });
        }

        return profile;
    }

    async create(userId: string, dto: CreateProfileDto) {
        // Check max profiles limit
        const count = await this.prisma.profile.count({ where: { userId } });
        if (count >= this.MAX_PROFILES) {
            throw new ForbiddenException({
                code: 'MAX_PROFILES_REACHED',
                message: `Maximum ${this.MAX_PROFILES} profiles allowed per account`,
            });
        }

        const maxRating = this.normalizeRating(dto.maxRating)
            || (dto.isKids ? MaturityRating.PG : MaturityRating.NC_17);

        const pinHash = dto.pin ? await bcrypt.hash(dto.pin, 10) : null;

        return this.prisma.profile.create({
            data: {
                userId,
                name: dto.name,
                avatarUrl: dto.avatarUrl || null,
                isKids: dto.isKids ?? false,
                maxRating,
                pinEnabled: !!pinHash,
                pinHash,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateProfileDto) {
        await this.findOne(id, userId); // Verify ownership
        const data: Record<string, unknown> = {};

        if (dto.name !== undefined) data.name = dto.name;
        if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
        if (dto.isKids !== undefined) data.isKids = dto.isKids;

        if (dto.maxRating) {
            const rating = this.normalizeRating(dto.maxRating);
            if (rating) data.maxRating = rating;
        }

        if (dto.pinEnabled === false) {
            data.pinEnabled = false;
            data.pinHash = null;
        }

        if (dto.pin) {
            data.pinEnabled = true;
            data.pinHash = await bcrypt.hash(dto.pin, 10);
        }

        return this.prisma.profile.update({
            where: { id },
            data,
        });
    }

    async delete(id: string, userId: string) {
        await this.findOne(id, userId); // Verify ownership

        // Don't allow deleting the last profile
        const count = await this.prisma.profile.count({ where: { userId } });
        if (count <= 1) {
            throw new ForbiddenException({
                code: 'CANNOT_DELETE_LAST_PROFILE',
                message: 'Cannot delete the last profile',
            });
        }

        await this.prisma.profile.delete({
            where: { id },
        });

        return { success: true };
    }

    /**
     * Create a default profile for a new user
     */
    async createDefaultProfile(userId: string, name = 'Default') {
        return this.prisma.profile.create({
            data: {
                userId,
                name,
                isKids: false,
                maxRating: MaturityRating.NC_17,
            },
        });
    }

    private normalizeRating(value?: string): MaturityRating | null {
        if (!value) return null;
        const upper = value.toUpperCase().replace('-', '_');
        switch (upper) {
            case 'G':
                return MaturityRating.G;
            case 'PG':
                return MaturityRating.PG;
            case 'PG_13':
                return MaturityRating.PG_13;
            case 'R':
                return MaturityRating.R;
            case 'NC_17':
                return MaturityRating.NC_17;
            default:
                return null;
        }
    }
}
