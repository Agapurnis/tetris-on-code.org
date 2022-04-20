import { TetriminoType } from "./Tetrimino";

export class Bag {
    private static randomTypes (): TetriminoType[] {
        return [
            TetriminoType.I,
            TetriminoType.J,
            TetriminoType.L,
            TetriminoType.O,
            TetriminoType.S,
            TetriminoType.T,
            TetriminoType.Z,
        ].sort(() => Math.random() - Math.random());
    }

    // Inner bags while are alternated and filled/used.
    private _a: TetriminoType[] = Bag.randomTypes();
    private _b: TetriminoType[] = Bag.randomTypes();

    preview (n = 5): TetriminoType[] {
        return [...this._a, ...this._b].slice(0, n);
    }

    pick (): TetriminoType {
        // The bag will always be populated due to the nature of how it works.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const type = this._a.shift()!;

        if (this._a.length === 0) {
            this._a = this._b;
            this._b = Bag.randomTypes();
        }
    
        return type;
    }
}
