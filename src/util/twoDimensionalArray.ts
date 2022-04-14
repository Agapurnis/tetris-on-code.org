export function twoDimensionalArray <T> (width: number, height: number, fill?: T): T[][] {
    const array = new Array(height) as T[][];

    for (let i = 0; i < height; i++) {
        array[i] = new Array(width) as T[];
        if (fill !== undefined) {
            for (let j = 0; j < width; j++) {
                array[i][j] = fill;
            }
        }
    }

    return array;
}
