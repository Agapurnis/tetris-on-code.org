/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Pixel, PixelState } from "./Pixel";
import type { Session } from "./Session";
import { InputManager } from "./InputManager";
import { twoDimensionalArray } from "./util/twoDimensionalArray";
import { Tetrimino, TetriminoState } from "./Tetrimino";
import { Bag } from "./Bag";
import { ALLOCATED_HEIGHT, ALLOCATED_WIDTH } from "./util/sizes";

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
        public board: GameBoard = twoDimensionalArray(size[1][0], size[0][0], null)
    ) {} 

    private ended = false;
    public paused = true;
    public readonly bag = new Bag();
    public tetriminos: Tetrimino[] = [];
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
        this.active!.draw();
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
        let start: number | undefined;
        let temp = false;
        const b = this.board;
        const clear = this.board.filter((row, i) => (temp = !row.every((pixel) => pixel !== null ? pixel.solid : false), !temp ? (start ??= i, temp) : temp));
        const cleared = this.board.length - clear.length;
        const adjusted: Record<string, Tetrimino> = {};
        if (!start) return 0;
        console.log(start);

        // Remove the filled rows and replace them with empty ones.
        this.board.splice(start, cleared);
        for (let i = 0; i < cleared; i++) {
            const array = new Array(this.size[1][0]);
            for (let j = 0; j < array.length; j++) {
                const e = b[b.length-i]?.[j];
                if (e && e.solid) adjusted[e.tetrimino!.id] = e.tetrimino!;
                array[j] = null;
            }
            this.board.unshift(array as BoardElement[]);
        }

        // Adjust the pixels of the tetriminos that had an intersection of their pixels with the cleared lines.
        Object.keys(adjusted).map((key) => adjusted[key]).forEach((tetrimino) => {
            tetrimino.pixels.splice(start! - tetrimino.y, cleared);
            for (let i = 0; i < cleared; i++) {
                const array = new Array(tetrimino.pixels.length);
                for (let j = 0; j < array.length; j++) { array[j] = null; }
                tetrimino.pixels.unshift(array as BoardElement[]);
            }

            // Update the actual pixels on the board from the new state of the tetrimino's pixels.
            tetrimino.pixels.forEach((row, y) => {
                row.forEach((pixel, x) => {
                    this.board[y + tetrimino.y][x + tetrimino.x] = pixel;
                });
            });
        });

        // Move down every tetrimino that was above the cleared lines.
        this.tetriminos.forEach((tetrimino) => {
            if (tetrimino.y  < start!) {
                tetrimino.y += cleared;
            }
        });

        // Return number of lines cleared.
        return cleared;
    }

    /**
      * Miscellaneous functionality that should be run after a piece is dropped.
      */
    private clear () {
        if (this.ended) return;
        if (this.paused) return;
        if (!this.active) {
            throw new Error("No active was found, even though it should always be filled!\nThis likely means a tick was ran after the game should have been ended, since no more spots are available.");
        }

        this.active.solidify();
        // Pick a new tetrimino
        this.active = Tetrimino.ofTypeForGame(this.bag.pick(), this);
        this.active?.draw();

        if (!this.active) {
            throw new Error("Game over!");
        }

        // TODO: Check for combos.
        const cleared = this.clean();
        const points = 0; // TODO
        
        this.score.points += points;
        this.score.lines  += cleared; 
        
        if (cleared !== 0) {
            this.draw();
            // TODO
        }
    }

    public draw () {
        setActiveCanvas("solid");
        clearCanvas();
        
        this.active?.clear();
        this.tetriminos.forEach((tetrimino) => {
            tetrimino.draw();
        });
    }
}
