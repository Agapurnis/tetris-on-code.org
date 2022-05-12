import { Tetrimino, TetriminoState, TetriminoType } from "./Tetrimino";

export enum PixelState {
    FULL,
    VOID,
}

export class Pixel {
    constructor(
        /** absolute */
        public coordinates: [number, number],
        public tetrimino: TetriminoType,
        public state: TetriminoState,
        public solid = false,
    ) {}

    /** @returns null for empty */
    public static forTetrimino (
        tetrimino: Tetrimino,
        coordinates: [number, number],
        falling = false,
    ): Pixel | null {
        return falling ? new Pixel(
            coordinates,
            tetrimino.type,
            tetrimino.state,
        ) : null;
    }
}
