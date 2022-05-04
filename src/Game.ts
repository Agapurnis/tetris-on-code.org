/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Session } from "./Session";
import { InputManager } from "./InputManager";
import { twoDimensionalArray } from "./util/twoDimensionalArray";
import { Tetrimino } from "./Tetrimino";
import { Pixel } from "./Pixel";
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
        // This will refer to the index at which the first line is cleared.
        // We can then use the amount of lines cleared to get a range of cleared lines.
        // Note that index `0` is the top of the game (slightly off-screen), and as you increment, you go downwards.
        let start: number | undefined;
        let temp = false;

        // Initialize a clone to use for mutations.
        const b = this.board;
    
        // This creates a version of the board without full rows, while also setting `start` to the index at which it first begins removing.
        const clear = this.board.filter((row, i) => (temp = !row.every((pixel) => pixel !== null ? pixel.solid : false), !temp ? (start ??= i, temp) : temp));
        const cleared = this.board.length - clear.length; // Number of lines cleared.
        const adjusted: Record<string, Tetrimino> = {};

        // If we never removed any rows, this is undefined, which could cause some issues.
        if (!start) return 0;
        
        
        // Erase all traces of non-active tetriminos.
        // This is done because when we add the new states, we don't want to have old ones still present.
        this.tetriminos.forEach((tetrimino) => {
            // Replace all of the pixels occupied by tetriminos.
            tetrimino.pixels.forEach((row, y) => {
                row.forEach((_, x) => {
                    // If this new position is out of bounds.
                    if (!b[tetrimino.y + y]) return;
                    // Set the position it occupied to null.
                    b[tetrimino.y + y][x] = null;
                });
            });
        });

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
                const e = b[b.length-i]?.[j];

                // If the pixel exists (not `undefined` or `null`) and is indeed solid, record this
                // tetrimino as being "adjusted", meaning we will end up mutating it's inner pixel state to reflect this change.
                if (e && e.solid) {
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

        // Adjust the pixels of the tetriminos that had an intersection of their pixels with the cleared lines.
        // The weird code below is just retrieving the values as an array, since we can't use `Object.values`
        Object.keys(adjusted).map((key) => adjusted[key]).forEach((tetrimino) => {
            // Starting at the row relative to the tetrimino and not the whole board,
            // remove n lines, where n is the number of lines cleared for the board.
            tetrimino.pixels.splice(start! - tetrimino.y, cleared);

            // Replace the deleted rows with empty ones starting from the top,
            // which will shift everything down and ensure constant length.
            for (let i = 0; i < cleared; i++) {
                // Create an array of the length of the pixel row and fill it with null.
                const array = new Array(tetrimino.pixels.length);
                for (let j = 0; j < array.length; j++) { array[j] = null; }

                // Add the new empty row to the top of the tetrimino pixels to
                // shift everything downwards and maintain constant length.
                tetrimino.pixels.unshift(array as BoardElement[]);
            }
        });

        // Update every tetrimino by placing their inner pixels on the board once again,
        // and updating their height if they were above the area of the cleared lines.
        this.tetriminos.forEach((tetrimino) => {
            // We don't do anything to the active piece as it can cause issues.
            if (tetrimino.active) return;
            
            // Move tetriminos above the cleared lines.
            // If the tetriminos below or at that level, this would cause them to be moved off-screen, which isn't smart.
            if (tetrimino.y  < start!) {
                tetrimino.y += cleared;
                console.log(tetrimino.y);
            }

            // TODO: Remove tetriminos that are now off-screen.

            // Update the board by setting all tetrimino pixels onto the game board.
            tetrimino.pixels.forEach((row, y) => {
                row.forEach((pixel, x) => {
                    if (!pixel) return; // We don't want to set null pixels, as that will get rid of actual pixels.
                    if (!b[tetrimino.y + y]) return; // We should not attempt to set anything out of bounds.
                    b[tetrimino.y + y][x] = pixel;
                });
            });
        });

        // Set new board state.
        this.board = b;

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
