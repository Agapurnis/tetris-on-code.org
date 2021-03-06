function isObject (obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null;
}

export type RecursivePartial <T> = { [P in keyof T]?: RecursivePartial<T[P]> };
export type RecursiveAssign <T, U> = { [P in keyof T]: T[P] extends U ? U : RecursiveAssign<T[P], U> };
/** right -> left, ret left */
export function recursiveAssign <T, U extends RecursivePartial<T>> (left: T, right: U): RecursiveAssign<T, U> {
    // btw dont trust this function its probably terrible

    if (left === undefined || left === null) return right as unknown as RecursiveAssign<T, U>;
    if (!isObject(left) && !isObject(right)) return right as unknown as RecursiveAssign<T, U>;
    if ( isObject(left) && !isObject(right)) {
        if (right === null) return left as unknown as RecursiveAssign<T, U>;
        throw new Error("Cannot assign a non-object to an object; " + JSON.stringify(left) + "; " + JSON.stringify(right));
    }
    // if (!isObject(slot) &&  isObject(right)) throw new Error("Cannot assign an object to a non-object"); // Technically I think you could in non-strict mode, but I'm not going to support that.

    // This might throw in strict mode if slot isn't an object, but we aren't using strict mode.
    for (const key of Object.keys(right)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - we know this is unsafe
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        left[key as keyof typeof left] = recursiveAssign(left[key], right[key]) as T[keyof T];
    }
    
    return left as unknown as RecursiveAssign<T, U>;
}
