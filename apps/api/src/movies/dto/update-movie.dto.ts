import { IsString, IsOptional, IsArray, IsInt, MaxLength, IsUUID } from 'class-validator';

export class UpdateMovieDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    genreIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    actors?: string[];

    @IsOptional()
    @IsInt()
    releaseYear?: number;

    @IsOptional()
    @IsInt()
    durationSeconds?: number;
}
