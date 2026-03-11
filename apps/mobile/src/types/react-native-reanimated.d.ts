import type { ComponentType } from 'react';

export interface SharedValue<T> {
    value: T;
}

export function useSharedValue<T>(initialValue: T): SharedValue<T>;
export function useAnimatedStyle<T extends object>(updater: () => T): T;
export function withRepeat<T>(animation: T, numberOfReps?: number, reverse?: boolean): T;
export function withTiming<T>(toValue: T, config?: { duration?: number }): T;
export function withSequence<T>(...animations: T[]): T;

interface EnteringAnimation {
    delay(ms: number): EnteringAnimation;
    springify(): EnteringAnimation;
}

export const FadeInDown: EnteringAnimation;
export const FadeInRight: EnteringAnimation;

interface AnimatedNamespace {
    View: ComponentType<any>;
    createAnimatedComponent<P>(component: ComponentType<P>): ComponentType<P>;
}

declare const Animated: AnimatedNamespace;
export default Animated;
