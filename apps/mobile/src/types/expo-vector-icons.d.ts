import type { ComponentType } from 'react';

export const Ionicons: ComponentType<{
    name?: string;
    size?: number;
    color?: string;
    style?: unknown;
}> & {
    glyphMap: Record<string, string>;
};
