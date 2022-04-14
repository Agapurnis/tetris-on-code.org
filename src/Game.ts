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
    [10, 10], // Width
    [22, 20], // Height
] as BoardSize;

export type GameBoard = BoardElement[][]
export class Game {
    constructor (
        public readonly session: Session,
        public readonly size: BoardSize = DEFAULT_BOARD_SIZE,
        public tetriminos: Tetrimino[] = [],
        public board: GameBoard = twoDimensionalArray(size[0][1], size[1][1], null)
    ) {}

    private ended = false;
    private paused = true;
    public bag = new Bag();
    public inputs = new InputManager(this, InputManager.DEFAULT_MAPPINGS);
    public score: ScoreRecord = EMPTY_SCORE_RECORD;

    public active: Tetrimino | null = null; // The active, controlled tetrmino.
    public held:   Tetrimino | null = null; // The stored, idle tetrimino.

    
    /**
      * Starts the game and begins listening to user input.
      */
    public start (): void {
        this.paused = false;
        this.inputs.listen();
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
        if (this.ended) return;
        if (this.paused) return;


        this.active.move([0, 1]); // Move downwards once.
        this.active.record();     // Record the current position of the active tetrmino in an array, used to detect combos.

        // TODO: Check for combos.
        const cleared = this.clear();
        const points = 0; // TODO

        this.score.points += points;
        this.score.lines  += cleared; 

        if (cleared !== 0) {
            // TODO
        }

        // TODO
    }

    /**
      * Clears lines that are full, and returns the number of lines cleared.
      */
    private clear (): number {
        // TODO
    }
}
