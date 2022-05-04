/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Session } from "./Session";
import { InputManager } from "./InputManager";
import { twoDimensionalArray } from "./util/twoDimensionalArray";
import { Tetrimino, TetriminoState } from "./Tetrimino";
import { Pixel, PixelState } from "./Pixel";
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
            this.process();
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
        // This will refer to the index at which the first line is cleared.
        // We can then use the amount of lines cleared to get a range of cleared lines.
        // Note that index `0` is the top of the game (slightly off-screen), and as you increment, you go downwards.
        let start: number | undefined;
        let temp = false;

        // Initialize a clone to use for mutations.
        const b = this.board;
    
        // This creates a version of the board without full rows, while also setting `start` to the index at which it first begins removing.
        const clear = this.board.filter((row, i) => (temp = row.every((pixel) => pixel !== null), temp ? (start ??= i, !temp) : !temp));
        const cleared = this.board.length - clear.length; // Number of lines cleared.
        const adjusted: Record<string, Tetrimino> = {};
        start ??= this.board.length;
        
        // Remove the filled rows.
        b.splice(start, cleared);
        
        // Add new empty rows to the start so that things shift down and we maintain a constant board size.
        for (let i = 0; i < cleared; i++) {
            // Initialize an array that will be used to fill the gap left by the cleared rows.
            const array = new Array(this.size[1][0]);

            for (let j = 0; j < array.length; j++) {
                // Retrieve the pixel at the given index.
                // Note that this can be a `Pixel`, `undefined`, or `null`.
                //
                // `null` refers to an empty spcae
                // `Pixel` means exactly what you think.
                // `undefined` means we went OOB
                const e = b[start + i]?.[j];

                // If the pixel exists (not `undefined` or `null`) and is indeed solid, record this
                // tetrimino as being "adjusted", meaning we will end up mutating it's inner pixel state to reflect this change.
                if (e) {
                    adjusted[e.tetrimino!.id] = e.tetrimino!;
                }

                // Replace this element of the empty-row with nothing, as although
                // the row is 'empty', the array itself must contain some content.
                array[j] = null;
            }

            // Compensate for the removed rows by adding the new empty row.
            // We do this from the start so that everything shifts downwards.
            b.unshift(array as BoardElement[]);
        }

        // Set new board state.
        this.board = b;

        // Return number of lines cleared.
        return cleared;
    }

    /**
      * Miscellaneous functionality that should be run after a piece is dropped.
      */
    private process () {
        if (this.ended) return;
        if (this.paused) return;
        if (!this.active) {
            throw new Error("No active was found, even though it should always be filled!\nThis likely means a tick was ran after the game should have been ended, since no more spots are available.");
        }

        this.active.solidify();
        this.active.draw();
        this.active = Tetrimino.ofTypeForGame(this.bag.pick(), this);

        if (!this.active) {
            throw new Error("Game over!");
        } else {
            this.active.clear();
            this.active.draw();
        }

        // TODO: Check for combos.
        const cleared = this.clean();
        const points = 0; // TODO
        
        this.score.points += points;
        this.score.lines  += cleared; 
        
        if (cleared !== 0) {
            this.clear();
            this.draw();
            // TODO
        }
    }

    public clear () {
        setActiveCanvas("solid");
        clearCanvas();
    }

    public draw () {     
        this.active?.clear();
        this.active?.draw();

        setActiveCanvas("solid");
        setFillColor("#bababa");

        // Size for each pixel based on the allocated size for the game board canvas, and the actual size of the game.
        const sizeX = ALLOCATED_WIDTH  / this.size[1][1];
        const sizeY = ALLOCATED_HEIGHT / this.size[0][1];
        
        this.board.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    setFillColor(pixel.color[TetriminoState.SOLID]);
                    rect(
                        (x - (this.size[1][0] - this.size[1][1])) * sizeX,
                        (y - (this.size[0][0] - this.size[0][1])) * sizeY,
                        sizeX,
                        sizeY
                    );
                }
            });
        });
    }
}
