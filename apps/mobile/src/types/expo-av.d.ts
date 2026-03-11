import type { ForwardRefExoticComponent, RefAttributes } from 'react';

export interface Video {
    pauseAsync(): Promise<void>;
    playAsync(): Promise<void>;
    setPositionAsync(positionMillis: number): Promise<void>;
}

export interface AVPlaybackStatusLoaded {
    isLoaded: true;
    durationMillis?: number;
    positionMillis: number;
    isBuffering: boolean;
    isPlaying: boolean;
}

export interface AVPlaybackStatusError {
    isLoaded: false;
    error?: string;
}

export type AVPlaybackStatus = AVPlaybackStatusLoaded | AVPlaybackStatusError;

export interface VideoProps {
    source: { uri: string };
    style?: unknown;
    resizeMode?: string;
    shouldPlay?: boolean;
    rate?: number;
    onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
    onError?: (error: unknown) => void;
}

export const Video: ForwardRefExoticComponent<VideoProps & RefAttributes<Video>>;
export const ResizeMode: {
    CONTAIN: 'contain';
    COVER: 'cover';
    STRETCH: 'stretch';
};
