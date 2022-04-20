import { Tetrimino, TetriminoType } from "./Tetrimino";

export enum PixelState {
    FULL,
    VOID,
}

export class Pixel {
    constructor(
        public coordinates: [number, number],
        public tetrimino: TetriminoType | null = null,
    ) {}

    // #region Static Constructors
    public static forTetrimino (
        tetrimino: Tetrimino,
        coordinates: [number, number],
        pixelStatus: PixelState,
    ) {
        const pixel = new Pixel(
            coordinates,
            pixelStatus === PixelState.FULL ? tetrimino.type : null
        );
        
        pixel.falling = true;

        return pixel;
    }
    // #endregion Static Constructors

    public solid = false;
    public falling = false;
}
