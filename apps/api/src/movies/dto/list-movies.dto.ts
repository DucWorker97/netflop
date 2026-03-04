import { IsOptional, IsInt, IsString, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListMoviesDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsOptional()
    @IsUUID('4')
    genreId?: string;

    @IsOptional()
    @IsString()
    q?: string;

    @IsOptional()
    @IsEnum(['createdAt', 'title', 'releaseYear'])
    sort?: 'createdAt' | 'title' | 'releaseYear' = 'createdAt';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    order?: 'asc' | 'desc' = 'desc';

    // Status filter - used by frontend but service auto-filters based on user role
    @IsOptional()
    @IsString()
    status?: string;
}
