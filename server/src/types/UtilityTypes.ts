export type DeepReadonly<T> = { [K in keyof T]: DeepReadonly<T[K]> };
