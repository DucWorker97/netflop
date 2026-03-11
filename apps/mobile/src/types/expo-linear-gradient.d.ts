import type { ComponentType, ReactNode } from 'react';

interface Point {
    x: number;
    y: number;
}

export interface LinearGradientProps {
    children?: ReactNode;
    colors: readonly string[];
    end?: Point;
    start?: Point;
    style?: any;
}

export const LinearGradient: ComponentType<LinearGradientProps>;
