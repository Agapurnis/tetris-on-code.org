function isObject (obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null;
}

export type RecursivePartial <T> = { [P in keyof T]?: RecursivePartial<T[P]> };
export type RecursiveAssign <T, U> = { [P in keyof T]: T[P] extends U ? U : RecursiveAssign<T[P], U> };
export function recursiveAssign <T, U extends RecursivePartial<T>> (left: T, right: U): RecursiveAssign<T, U> {
    // btw dont trust this function its probably terrible

    let slot = left as unknown;
    if (slot === undefined && isObject(right)) slot = {};

    if ( isObject(slot) && !isObject(right)) throw new Error("Cannot assign a non-object to an object");
    if (!isObject(slot) &&  isObject(right)) throw new Error("Cannot assign an object to a non-object"); // Technically I think you could in non-strict mode, but I'm not going to support that.
    if (!isObject(slot) && !isObject(right)) return right as unknown as RecursiveAssign<T, U>;

    // This might throw in strict mode if slot isn't an object, but we aren't using strict mode.
    for (const key of Object.keys(right)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - we know this is unsafe
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        slot[key as keyof typeof left] = recursiveAssign(slot[key], right[key]) as T[keyof T];
    }
    
    return slot as RecursiveAssign<T, U>;
}
