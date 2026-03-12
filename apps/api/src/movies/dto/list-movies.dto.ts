import { IsOptional, IsInt, IsString, IsEnum, IsUUID, Min, Max, IsNumber, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { MovieStatus } from '@prisma/client';

export enum MovieSortField {
    createdAt = 'createdAt',
    title = 'title',
    releaseYear = 'releaseYear',
    voteAverage = 'voteAverage',
    popularity = 'popularity',
}

export enum SortOrder {
    asc = 'asc',
    desc = 'desc',
}

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
    @IsEnum(MovieSortField)
    sort?: MovieSortField = MovieSortField.createdAt;

    @IsOptional()
    @IsEnum(SortOrder)
    order?: SortOrder = SortOrder.desc;

    @IsOptional()
    @IsEnum(MovieStatus)
    status?: MovieStatus;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1900)
    yearFrom?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1900)
    yearTo?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(10)
    minRating?: number;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    language?: string;
}
