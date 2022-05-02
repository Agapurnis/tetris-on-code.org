import { Tetrimino, TetriminoState } from "./Tetrimino";

export enum PixelState {
    FULL,
    VOID,
}

export class Pixel {
    constructor(
        /** absolute */
        public coordinates: [number, number],
        public tetrimino: Tetrimino | null,
        public color: Record<TetriminoState, string>,
    ) {}

    // #region Static Constructors
    /** @returns null for empty */
    public static forTetrimino (
        tetrimino: Tetrimino,
        coordinates: [number, number],
        falling = false,
    ): Pixel | null {
        return falling ? new Pixel(
            coordinates,
            tetrimino,
            tetrimino.colors(),
        ) : null;
    }

    // #endregion Static Constructors
    public solid = false;

}
