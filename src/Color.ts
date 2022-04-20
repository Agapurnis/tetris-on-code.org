import { TetriminoState, TetriminoType } from "./Tetrimino";

export interface ColorTheme {
    background: string;
    foreground: string;

    tetriminos: Record<TetriminoType, Record<TetriminoState, string>>
}

export const DEFAULT_COLOR_THEME: ColorTheme = {
    background: "rgb(52, 57, 70)",
    foreground: "rgb(241, 241, 241)",

    tetriminos: {
        [TetriminoType.O]: { [TetriminoState.FALLING]: "#f7e731", [TetriminoState.SOLID]: "#ebe468" },
        [TetriminoType.L]: { [TetriminoState.FALLING]: "#f9a32a", [TetriminoState.SOLID]: "#e59424" },
        [TetriminoType.J]: { [TetriminoState.FALLING]: "#3022d6", [TetriminoState.SOLID]: "#4d44c8" },
        [TetriminoType.I]: { [TetriminoState.FALLING]: "#34e5ea", [TetriminoState.SOLID]: "#4de1e6" },
        [TetriminoType.T]: { [TetriminoState.FALLING]: "#d741cb", [TetriminoState.SOLID]: "#af2da4" },
        [TetriminoType.S]: { [TetriminoState.FALLING]: "#30d924", [TetriminoState.SOLID]: "#36cb2b" },
        [TetriminoType.Z]: { [TetriminoState.FALLING]: "#e42424", [TetriminoState.SOLID]: "#ef2b2b" },   
    }
};
