type ElementByQueryString<T extends string> =
    T extends `${infer TagName}#${string}`
        ? TagName extends keyof HTMLElementTagNameMap
            ? HTMLElementTagNameMap[TagName]
            : Element
        : Element;

export function getOrThrow<T extends string>(
    queryString: T,
): ElementByQueryString<T> {
    const element =
        document.querySelector<ElementByQueryString<T>>(queryString);

    if (element === null) {
        throw new Error(`Element not found: ${queryString}`);
    }

    return element;
}
