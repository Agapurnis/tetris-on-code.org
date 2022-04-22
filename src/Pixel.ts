import { Tetrimino } from "./Tetrimino";

export enum PixelState {
    FULL,
    VOID,
}

export class Pixel {
    constructor(
        public coordinates: [number, number],
        public tetrimino: Tetrimino | null = null,
    ) {}

    // #region Static Constructors
    public static forTetrimino (
        tetrimino: Tetrimino,
        coordinates: [number, number],
        pixelStatus: PixelState,
    ) {
        const pixel = new Pixel(
            coordinates,
            pixelStatus === PixelState.FULL ? tetrimino : null
        );
        
        pixel.falling = true;

        return pixel;
    }
    // #endregion Static Constructors

    public solid = false;
    public falling = false;
}
