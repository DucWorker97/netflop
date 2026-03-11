import type { ComponentType, ReactNode } from 'react';

export type Href = string;
export type RelativePathString = string;
export type ExternalPathString = string;
export type UnknownInputParams = Record<string, string | number | boolean | undefined>;
export type UnknownOutputParams = Record<string, string | undefined>;
export type SingleRoutePart<T extends string | object = string> = string;

export namespace ExpoRouter {
    interface __routes<T extends string | object = string> {}
}

export interface Router {
    push(href: Href): void;
    replace(href: Href): void;
    back(): void;
}

export function useRouter(): Router;

export function useLocalSearchParams<
    T extends Record<string, string | string[] | undefined> = Record<string, string | string[] | undefined>,
>(): T;

type ScreenComponent = ComponentType<{
    name?: string;
    options?: Record<string, unknown>;
}>;

type NavigatorComponent = ComponentType<{
    children?: ReactNode;
    screenOptions?: Record<string, unknown>;
}> & {
    Screen: ScreenComponent;
};

export const Stack: NavigatorComponent;
export const Tabs: NavigatorComponent;
export const Redirect: ComponentType<{ href: Href }>;
