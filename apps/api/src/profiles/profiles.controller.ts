import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PolicyGuard } from '../common/guards/policy.guard';
import { ProfileOwnedPolicy } from '../common/decorators/check-policy.decorator';
import { ProfilesService } from './profiles.service';

const RATING_VALUES = ['G', 'PG', 'PG-13', 'R', 'NC-17'] as const;

class CreateProfileDto {
    @IsString()
    @MaxLength(50)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    avatarUrl?: string;

    @IsOptional()
    @IsBoolean()
    isKids?: boolean;

    @IsOptional()
    @IsIn(RATING_VALUES)
    maxRating?: (typeof RATING_VALUES)[number];

    @IsOptional()
    @IsString()
    @MinLength(4)
    @MaxLength(8)
    pin?: string;
}

class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    avatarUrl?: string;

    @IsOptional()
    @IsBoolean()
    isKids?: boolean;

    @IsOptional()
    @IsIn(RATING_VALUES)
    maxRating?: (typeof RATING_VALUES)[number];

    @IsOptional()
    @IsString()
    @MinLength(4)
    @MaxLength(8)
    pin?: string;

    @IsOptional()
    @IsBoolean()
    pinEnabled?: boolean;
}

@Controller('profiles')
@UseGuards(JwtAuthGuard, PolicyGuard)
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    /**
     * GET /api/profiles - Get all profiles for current user
     */
    @Get()
    async findAll(@Request() req: any) {
        const profiles = await this.profilesService.findByUser(req.user.id);
        return { data: profiles };
    }

    /**
     * GET /api/profiles/:id - Get single profile
     */
    @Get(':id')
    @ProfileOwnedPolicy('id')
    async findOne(
        @Request() req: any,
        @Param('id', ParseUUIDPipe) id: string
    ) {
        const profile = await this.profilesService.findOne(id, req.user.id);
        return { data: profile };
    }

    /**
     * POST /api/profiles - Create new profile
     */
    @Post()
    async create(
        @Request() req: any,
        @Body() dto: CreateProfileDto
    ) {
        const profile = await this.profilesService.create(req.user.id, dto);
        return { data: profile };
    }

    /**
     * PUT /api/profiles/:id - Update profile
     */
    @Put(':id')
    @ProfileOwnedPolicy('id')
    async update(
        @Request() req: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateProfileDto
    ) {
        const profile = await this.profilesService.update(id, req.user.id, dto);
        return { data: profile };
    }

    /**
     * DELETE /api/profiles/:id - Delete profile
     */
    @Delete(':id')
    @ProfileOwnedPolicy('id')
    async delete(
        @Request() req: any,
        @Param('id', ParseUUIDPipe) id: string
    ) {
        await this.profilesService.delete(id, req.user.id);
        return { success: true };
    }
}
