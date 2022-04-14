import { Game } from "./Game";
import { Tetrimino, TetriminoType } from "./Tetrimino";

export enum PixelState {
    FULL,
    VOID,
}

export class Pixel {
    /**
      * The tetrmino this pixel is a part of.
      * 
      * - Note that this value is null if the piece has solidifed.
      * - Note that the `Pixel.type` will always be initialized, despite the nullability status of `Pixel.tetrimino`.
      */
    public tetrimino: Tetrimino | null = null;

    constructor(
        private game: Game,
        public coordinates: [number, number],
        public type: TetriminoType | null = null,
    ) {
        const [x, y] = coordinates;
        this.game.board[y][x] = this;
        this.type = type;
    }

    // #region Static Constructors
    public static forTetrimino (
        tetrimino: Tetrimino,
        coordinates: [number, number],
        pixelStatus: PixelState,
    ) {
        return new Pixel(
            tetrimino.game,
            coordinates,
            pixelStatus === PixelState.FULL ? tetrimino.type : null
        );
    }
    // #endregion Static Constructors

    public solid = false;
}
