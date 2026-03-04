import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UploadCompleteDto {
    @IsString()
    objectKey!: string;

    @IsOptional()
    @IsEnum(['video', 'thumbnail'])
    fileType?: 'video' | 'thumbnail' = 'video';
}
