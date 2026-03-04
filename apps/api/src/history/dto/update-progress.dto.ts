import { IsInt, Min } from 'class-validator';

export class UpdateProgressDto {
    @IsInt()
    @Min(0)
    progressSeconds!: number;

    @IsInt()
    @Min(1)
    durationSeconds!: number;
}
