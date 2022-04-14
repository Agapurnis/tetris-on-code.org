import type { Game, GameBoard } from "./Game";
import { Pixel, PixelState } from "./Pixel";

export const enum TetriminoType { I, J, L, O, S, T, Z, }
export const enum TetriminoState {
    SOLID,
    FULLING,
}

const TETRIMINO_PIXELS_GENERATOR: Record<TetriminoType, (self: Tetrimino) => Pixel[][]> = {
    [TetriminoType.O] : (self) => [
        [PixelState.VOID, PixelState.FULL, PixelState.FULL, PixelState.VOID],
        [PixelState.VOID, PixelState.FULL, PixelState.FULL, PixelState.VOID],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ].map((row, y) => row.map((pixel, x) => Pixel.forTetrimino(self, [x, y], pixel))),

    [TetriminoType.L] : (self) => [
        [PixelState.VOID, PixelState.VOID, PixelState.FULL],
        [PixelState.FULL, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ].map((row, y) => row.map((pixel, x) => Pixel.forTetrimino(self, [x, y], pixel))),

    [TetriminoType.J] : (self) => [
        [PixelState.FULL, PixelState.VOID, PixelState.VOID],
        [PixelState.FULL, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ].map((row, y) => row.map((pixel, x) => Pixel.forTetrimino(self, [x, y], pixel))),

    [TetriminoType.I] : (self) => [
        [PixelState.VOID, PixelState.VOID, PixelState.VOID, PixelState.VOID],
        [PixelState.FULL, PixelState.FULL, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID, PixelState.VOID],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ].map((row, y) => row.map((pixel, x) => Pixel.forTetrimino(self, [x, y], pixel))),

    [TetriminoType.T] : (self) => [
        [PixelState.VOID, PixelState.FULL, PixelState.VOID],
        [PixelState.FULL, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ].map((row, y) => row.map((pixel, x) => Pixel.forTetrimino(self, [x, y], pixel))),

    [TetriminoType.S] : (self) => [
		[PixelState.VOID, PixelState.FULL, PixelState.FULL],
        [PixelState.FULL, PixelState.FULL, PixelState.VOID],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],   
    ].map((row, y) => row.map((pixel, x) => Pixel.forTetrimino(self, [x, y], pixel))),

    [TetriminoType.Z] : (self) => [
        [PixelState.FULL, PixelState.FULL, PixelState.VOID],
        [PixelState.VOID, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ].map((row, y) => row.map((pixel, x) => Pixel.forTetrimino(self, [x, y], pixel))),
};

export class Tetrimino {
    constructor(
        public x: number,
        public y: number,
        public game: Game,
        public state: TetriminoState,
        public readonly type: TetriminoType,
    ) {
        game.tetriminos.push(this);
    }
        
    public readonly pixels: Pixel[][] = TETRIMINO_PIXELS_GENERATOR[this.type](this);
    public active = false;
    public held   = false;

    public static canPlaceTetriminoOfTypeInBoard (
        type: TetriminoType,
        board: GameBoard,
    ): boolean {
        // TODO
        return false;
    }

    /**
      * @returns the tetrimino
      * @throws if it couldn't be placed (use `canPlaceTetriminoOfTypeInBoard` to check)
      */
    public static ofTypeForBoard (game: Game, type: TetriminoType): Tetrimino {
        // TODO
    }

}
