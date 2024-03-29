/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Session } from "./Session";
import { ALLOCATED_HEIGHT, ALLOCATED_WIDTH } from "./util/sizes";
import { InputManager } from "./InputManager";
import { twoDimensionalArray } from "./util/twoDimensionalArray";
import { Tetrimino, TetriminoState } from "./Tetrimino";
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

    public ended = false;
    public paused = true;
    /**
     * Whether or not a swap has occured in between the time since the last piece-drop.
     */
    public swapped = false;
    public bag = new Bag();
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
        start ??= this.board.length;
        
        // Remove the filled rows.
        b.splice(start, cleared);
        
        // Add new empty rows to the start so that things shift down and we maintain a constant board size.
        for (let i = 0; i < cleared; i++) {
            // Initialize an array that will be used to fill the gap left by the cleared rows.
            const array = new Array(this.size[1][0]);

            for (let j = 0; j < array.length; j++) {
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

        // Allow the user to swap pieces again.
        this.swapped = false;
        // Indicate the swap can be performed again.
        setText("held-lock-state", "✔️");

        this.active.solidify();
        this.active.draw();
        this.active = Tetrimino.ofTypeForGame(this.bag.pick(), this);

        if (!this.active) {
            throw new Error("Game over!");
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

        this.active.clear();
        this.active.draw();
    }

    public clear () {
        setActiveCanvas("solid");
        clearCanvas();
    }

    public draw () {     
        setActiveCanvas("solid");

        // Size for each pixel based on the allocated size for the game board canvas, and the actual size of the game.
        const sizeX = ALLOCATED_WIDTH  / this.size[1][1];
        const sizeY = ALLOCATED_HEIGHT / this.size[0][1];
        
        this.board.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    setFillColor(this.session.user.theme.tetriminos[pixel.tetrimino][TetriminoState.SOLID]);
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

    /**
     * @returns whether or not the swap was performed
     * @remarks does not swap if one of the following is true:
     *  - The game is paused.
     *  - The game has ended.
     *  - The user has already swapped in the time since the last piece-drop.
     */
    public trySwapHeld (): boolean {
        if (this.ended) return false;
        if (this.paused) return false;
        if (this.swapped) return false;

        // Prevent swapping again until after the next piece-drop.
        this.swapped = true;

        // Put our active and held pieces into variables for usage after they are replaced.
        const active = this.active;
        const held = this.held;

        // Put the held piece into the active slot.
        this.active = held ?? Tetrimino.ofTypeForGame(this.bag.pick(), this);
        if (!this.active) return false;
        this.active.held = false;
        this.active.active = true;

        // Set the position of this piece to the position of the (previously) active piece.
        this.active.x = active!.x;
        this.active.y = active!.y;

        // Check for collisions.
        if (!this.active.move([0, 0])) {
            // If there are collisions, put the active piece back into the held slot.
            this.held = this.active;
            this.held.held = true;
            this.held.active = false;
            // Put our previously-active piece back into the active slot.
            this.active = active;
            // We will set `this.swapped` to be false, as we want to allow the user to swap again despite this.
            this.swapped = false;
            // Return false, as the swap was not performed.
            return false;
        }

        // Put the (previously) active piece into the held slot.
        this.held = active;
        if (!this.held) return false;
        this.held.held = true;
        this.held.active = false;

        // Indicate a swap was preformed.
        setText("held-lock-state", "❌");

        // Draw the new active piece newly held piece.
        this.held.clear();
        this.held.draw();
        this.active.invalidateZenithMemo();
        this.active.moveCanvas();
        this.active.clear();
        this.active.draw();
        
        return true;
    }

    // #region serde, mut
    public serialize () {
        return {
            bag: this.bag.serialize(),
            size: this.size,
            score: this.score,
            board: this.board.map((row) => row.map((pixel) => pixel ? [pixel.state, pixel.tetrimino] as const : null)),
            active: this.active ? this.active.serialize() : null,
            held: this.held ? this.held.serialize() : null,
            state: [this.paused, this.ended, this.swapped]
        };
    }

    public update (data: ReturnType<Game["serialize"]>) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.size = data.size;
        this.board = data.board.map((row, y) => row.map((pixel, x) => pixel ? new Pixel([x, y], pixel[1], pixel[0], true) : null));
        this.bag = Bag.deserialize(data.bag);
        this.swapped = data.state[2];
        this.paused = data.state[0];
        this.ended = data.state[1];
        this.score = data.score;
        this.active = data.active ? Tetrimino.deserialize(this, data.active) : null;
        this.held = data.held ? Tetrimino.deserialize(this, data.held) : null;
    } 

    public static deserialize (data: ReturnType<Game["serialize"]>) {
        const game = new Game(null!, data.size, data.board.map((row, y) => row.map((pixel, x) => pixel ? new Pixel([x, y], pixel[1], pixel[0], true) : null)));
        game.bag = Bag.deserialize(data.bag);
        game.swapped = data.state[2];
        game.paused = data.state[0];
        game.ended = data.state[1];
        game.score = data.score;
        game.active = data.active ? Tetrimino.deserialize(game, data.active) : null;
        game.held = data.held ? Tetrimino.deserialize(game, data.held) : null;
        return game;
    }
    // #endregion serde, mut
}
