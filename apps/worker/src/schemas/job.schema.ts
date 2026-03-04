import { z } from 'zod';

// Rendition definition
export const RenditionSchema = z.object({
    name: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    bitrate: z.string(),
});

export type Rendition = z.infer<typeof RenditionSchema>;

// Job payload schema
export const EncodeJobSchema = z.object({
    movieId: z.string().uuid(),
    inputKey: z.string().min(1),
    outputPrefix: z.string().min(1),
    requestId: z.string().optional(),
    renditions: z.array(RenditionSchema).optional(),
});

export type EncodeJobData = z.infer<typeof EncodeJobSchema>;

// Default renditions if not specified
export const DEFAULT_RENDITIONS: Rendition[] = [
    { name: '360p', width: 640, height: 360, bitrate: '800k' },
    { name: '480p', width: 854, height: 480, bitrate: '1400k' },
    { name: '720p', width: 1280, height: 720, bitrate: '2800k' },
    { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
];
