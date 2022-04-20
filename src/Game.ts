/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Pixel } from "./Pixel";
import type { Session } from "./Session";
import { InputManager } from "./InputManager";
import { twoDimensionalArray } from "./util/twoDimensionalArray";
import { Tetrimino } from "./Tetrimino";
import { Bag } from "./Bag";

interface ScoreRecord {
    points: number,
    lines: number, // actual number of lines cleared
    level: number,
}

const EMPTY_SCORE_RECORD: ScoreRecord = {
    points: 0,
    lines: 0,
    level: 1,
};

type BoardElement = Pixel | null;
type BoardSize = [
    height: [simulated: number, rendered: number], 
    width:  [simulated: number, rendered: number], // note: simulated width is always rendered width
];

const DEFAULT_BOARD_SIZE = [
    [22, 20], // Height
    [10, 10], // Width
] as BoardSize;

export type GameBoard = BoardElement[][];
export class Game {
    public static ALLOCATED_WIDTH  = 200;
    public static ALLOCATED_HEIGHT = 400;

    constructor (
        public readonly session: Session,
        public readonly size: BoardSize = DEFAULT_BOARD_SIZE,
        public tetriminos: Tetrimino[] = [],
        public board: GameBoard = twoDimensionalArray(size[1][0], size[0][0], null)
    ) {} 

    private ended = false;
    private paused = true;
    public readonly bag = new Bag();
    public inputs = new InputManager(this, InputManager.DEFAULT_MAPPINGS);
    public timer: [number, number] = [0, 0];
    public score: ScoreRecord = EMPTY_SCORE_RECORD;

    public active: Tetrimino | null = null; // The active, controlled tetrmino.
    public held:   Tetrimino | null = null; // The stored, idle tetrimino.

    
    /**
      * Starts the game.
      * 
      * @remarks
      *  - The main game loop starts using the provided interval in milliseconds, or the default of 400.
      *  - The game is paused by default.
      *  - Input listening only begins after this start of the game.
      *  - An initial random tetrimino is chosen from the bag.
      * 
      * 
      */
    public start (ms = /* 400 */ 200): void {
        this.inputs.listen();
        this.paused = false;
        this.active = Tetrimino.ofTypeForGame(this.bag.pick(), this);
        this.active!.drawCanvas();
        this.active!.moveCanvas();
        this.timer = [ms, setInterval(() => {
            this.tick();
        }, ms) as unknown as number /* Node typings appear here for some reason. */];
    }


    public   pause () { if (this.ended) return; this.paused = true ; }
    public unpause () { if (this.ended) return; this.paused = false; }

    /**
      * Displays a game over message, and pauses the game in a way that can't be undone by the user without creating a new game.
      */
    public gameOver () {
        this.ended  = true;
        this.paused = true;

        // TODO: Display.
    }

    /**
      * Does one tick of the game.
      */
    public tick (): void {
        const t = +Date.now();
        if (this.ended) return;
        if (this.paused) return;
        if (!this.active) {
            throw new Error("No active was found, even though it should always be filled!\nThis likely means a tick was ran after the game should have been ended, since no more spots are available.");
        }

        if (!this.active.move([0, 1])) {
            this.clear();
        }

        this.active?.moveCanvas();

        if (this.session.user.config.developer.logging.tick) {
            console.log(`Processed tick in ${+Date.now() - t}ms.`);
        }
    }

    /**
      * Cleans lines that are full, and returns the number of lines cleared.
      */
    private clean (): number {
        const clear = this.board.filter((row) => !row.every((pixel) => pixel && pixel.solid === true ));
        const cleared = this.board.length - clear.length;

        this.board.filter((row) => row.every((pixel) => pixel && pixel.solid === true)).forEach((row) => {
            row.forEach((pixelNullable) => {
                if (pixelNullable) {
                    pixelNullable.tetrimino = null;
                    pixelNullable.solid = false;
                }
            });
        });

        // Now add the blank rows so we don't actually lose the entire existance of a line, haha.
        for (let i = 0; i < cleared; i++) {
            const array = new Array(this.size[1][0]); for (let i = 0; i < array.length; i++) array[i] = null;
            this.board.unshift(array as BoardElement[]);
        }

        // Return number of lines cleared.
        return cleared;
    }

    /**
      * Miscellaneous functionality that should be run after a line is cleared.
      */
    private clear () {
        if (this.ended) return;
        if (this.paused) return;
        if (!this.active) {
            throw new Error("No active was found, even though it should always be filled!\nThis likely means a tick was ran after the game should have been ended, since no more spots are available.");
        }

        const ch = this.active.y;
        this.active.active = false;
        this.active.solidify();
        this.active.drawCanvas();
        // Pick a new tetrimino
        this.active = Tetrimino.ofTypeForGame(this.bag.pick(), this);
        this.active?.drawCanvas();

        if (!this.active) {
            throw new Error("Game over!");
        }

        // TODO: Check for combos.
        const cleared = this.clean();
        const points = 0; // TODO

        this.score.points += points;
        this.score.lines  += cleared; 

        if (cleared !== 0) {
            this.tetriminos.forEach((tetrimino) => {
                if (tetrimino.y > ch) {
                    tetrimino.x += 0;
                    tetrimino.y += cleared;
    
                    tetrimino.moveCanvas();
                    tetrimino.drawCanvas();
                }
            });
        }
    }

    // #region Rendering Functionality

    public drawActive () {
        if (this.ended) return;
        if (this.paused) return;
        if (!this.active) {
            throw new Error("No active was found while trying to draw it!");
        }

        this.active.drawCanvas();
    }


    // #endregion Rendering Functionality
}
