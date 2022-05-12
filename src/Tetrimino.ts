import type { Game } from "./Game";
import { Pixel, PixelState } from "./Pixel";
import { ALLOCATED_HEIGHT, ALLOCATED_WIDTH } from "./util/sizes";

function is (a: [Facing, Facing], b: [Facing, Facing]) { return a.every((e, i) => e === b[i]); }

export const enum TetriminoType {
    O,
    L,
    J,
    I,
    T,
    S,
    Z,
}

export const enum TetriminoState {
    SOLID,
    FALLING,
}

export const enum Rotation {
    SIMPLE,
    SUPER
}

export const enum Direction {
           CLOCKWISE = +1,
    COUNTERCLOCKWISE = -1,
}

const enum Facing {
    NORTH, EAST,
    SOUTH, WEST
}

const TETRIMINO_PIXEL_STATES: Record<TetriminoType, PixelState[][]> = {
    [TetriminoType.O]: [
        [PixelState.VOID, PixelState.FULL, PixelState.FULL, PixelState.VOID],
        [PixelState.VOID, PixelState.FULL, PixelState.FULL, PixelState.VOID],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ],

    [TetriminoType.L]: [
        [PixelState.VOID, PixelState.VOID, PixelState.FULL],
        [PixelState.FULL, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ],

    [TetriminoType.J]: [
        [PixelState.FULL, PixelState.VOID, PixelState.VOID],
        [PixelState.FULL, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ],

    [TetriminoType.I]: [
        [PixelState.VOID, PixelState.VOID, PixelState.VOID, PixelState.VOID],
        [PixelState.FULL, PixelState.FULL, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID, PixelState.VOID],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ],

    [TetriminoType.T]: [
        [PixelState.VOID, PixelState.FULL, PixelState.VOID],
        [PixelState.FULL, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ],

    [TetriminoType.S]: [
		[PixelState.VOID, PixelState.FULL, PixelState.FULL],
        [PixelState.FULL, PixelState.FULL, PixelState.VOID],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],   
    ],

    [TetriminoType.Z]: [
        [PixelState.FULL, PixelState.FULL, PixelState.VOID],
        [PixelState.VOID, PixelState.FULL, PixelState.FULL],
        [PixelState.VOID, PixelState.VOID, PixelState.VOID],
    ],
};

export class Tetrimino {
    constructor(
        public x: number,
        public y: number,
        public game: Game,
        public state: TetriminoState,
        public readonly type: TetriminoType,
    ) {
        this.active = true;
        this.pixels = TETRIMINO_PIXEL_STATES[this.type]
            // Convert all pixel states to actual pixels for this tetrimino with correct positioning.
            .map((row, y) => row.map((pixel, x) => Pixel.forTetrimino(this, [this.x + x, this.y + y], pixel === PixelState.FULL)));

        const id = (+Date.now()).toString();
        this.id = id;
    }
        
    public pixels: (Pixel | null)[][];
    public facing = Facing.NORTH;
    public active = false;
    public held   = false;
    public id: string;

    /**
      * @returns the tetrimino, **or null** if it cannot be placed
      * @remarks currently not very safe, only checks for colissions at the center.
      */
    public static ofTypeForGame (
        type: TetriminoType,
        game: Game,
    ): Tetrimino | null {
        const offset = TETRIMINO_PIXEL_STATES[type].filter((row) => row.some((pixel) => pixel !== PixelState.VOID)).length;
        const x = Math.floor((game.size[1][0] - TETRIMINO_PIXEL_STATES[type][0].length) / 2);
        const y = type === TetriminoType.I ? 0 : 1;

        // TODO: This only checks the 'center'.
        
        if (!game.board[y + offset]?.[x]) return new Tetrimino(x, y, game, TetriminoState.FALLING, type);
        return null;
    }

    /**
      * Attempts to move the tetrimino with the specified relative offset.
      * @returns true if the tetrimino was moved (it is a valid non-intersection), false otherwise
      * @remarks
      *  - Reverts upon collision
      *  - Invalidates zenith if horizontal movement occured
      */
    public move (adjustment: [number, number]){
        // Create a copy of the current position so that we can rollback if it is invalid
        const stasis = [this.x, this.y] as const;

        // Attempt to move the tetrimino
        this.x += adjustment[0];
        this.y += adjustment[1];

        // Check if the tetrimino is valid by iterating over all solid blocks,
        // translating their position into an absolute one through the position
        // of the tetrimino, and checking if they are either outside of the board,
        // or are already solid blocks. If one of these (in)validity check passes,
        // we rollback our state and then return false.
        for (let y = 0; y < this.pixels.length; y++) {
            for (let x = 0; x < this.pixels[y].length; x++) {
                const pixel = this.pixels[y][x];

                if (pixel) {
                    const [absoluteX, absoluteY] = [
                        this.x + x,
                        this.y + y,
                    ];

                    if (
                        absoluteX < 0 || absoluteX >= this.game.size[1][0] ||
                        absoluteY < 0 || absoluteY >= this.game.size[0][0] ||
                        this.game.board[absoluteY]?.[absoluteX]?.solid
                    ) {
                        this.x = stasis[0];
                        this.y = stasis[1];
                        return false;
                    }
                }
            }
        }

        // Invalid zenith if the tetrimino moved horizontally
        if (adjustment[0] !== 0) this.invalidateZenithMemo();

        // Indicate success without rollback
        return true;
    }

    /**
      * @throws if the tetrimino is already solidified
      * @remarks does not mark as inactive
      */
    public solidify () {
        this.active = false;
        this.state = TetriminoState.SOLID;
        this.pixels.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (!pixel) return;
                if (pixel.solid) throw new Error("Cannot solidify already solid pixel!");

                pixel.solid = true;
                if (this.game.board[this.y + y]?.[this.x + x] === null) {
                    this.game.board[this.y + y]  [this.x + x] = pixel;
                }
            });
        });
    }

    /**
     * 
     * @param rotation The type of rotation (basic or super)
     * @param direction The direcion to rotate in (clockwise or counterclockwise)
     * @returns whether or not the rotation succeeded
     * @remarks
     *  - Reverts if the rotation is invalid.
     *  - Marks zenith memo as invalidated upon successful rotation.
     */
    public rotate (rotation: Rotation, direction: Direction): boolean {
        const t = +Date.now();

        if (rotation === Rotation.SIMPLE) {
            const rotated: (Pixel | null)[][] = [];

            for (let col = 0; col < this.pixels[0].length; col++) {
              const temp: (Pixel | null)[] = [];
        
              for (let row = 0; row < this.pixels.length; row++) {
                if (direction === Direction.CLOCKWISE) {
                  if (this.game.board[this.y + row]?.[this.x + col] !== null) return false;
                  temp.push(this.pixels[this.pixels.length - 1 - row][col]);
                } else {
                  if (this.game.board[this.y + col]?.[this.x + row] !== null) return false;
                  temp.push(this.pixels[row][this.pixels[0].length - 1 - col]);
                }
              }
        
              rotated.push(temp);
            }
        
            this.pixels = rotated;

            if (this.game.session.user.config.developer.logging.rotate) {
                console.log(`Rotated (simple) in ${+Date.now() - t}ms`);
            }
        
            this.invalidateZenithMemo();

            return true;
        }

        if (rotation === Rotation.SUPER) {
            if (this.type === TetriminoType.O) return true;
            const facing: Facing = Math.abs((this.facing + (direction === Direction.CLOCKWISE ? 1 : -1)) % 4 /* full rot */);
            const change: [from: Facing, to: Facing] = [this.facing, facing];
            const stasis = [this.pixels, this.x, this.y] as const;
            this.facing = facing;
            let trans: [-2 | -1 | 0 | 1 | 2, -2 | -1 | 0 | 1 | 2][] = [];
            
            // TODO: Reduce size of below through math? I bet you can do some magical bit operations there.
        
            if ([TetriminoType.J, TetriminoType.L, TetriminoType.T, TetriminoType.S, TetriminoType.Z].some((e) => e === this.type)) {
                     if (is(change, [Facing.NORTH, Facing.EAST ])) trans = [[0,0],[-1,0],[-1,+1],[0,-2],[-1,-2]];
                else if (is(change, [Facing.NORTH, Facing.WEST ])) trans = [[0,0],[+1,0],[+1,+1],[0,-2],[+1,-2]];
                else if (is(change, [Facing.EAST,  Facing.NORTH])) trans = [[0,0],[+1,0],[+1,-1],[0,+2],[+1,+2]];
                else if (is(change, [Facing.EAST,  Facing.SOUTH])) trans = [[0,0],[+1,0],[+1,-1],[0,+2],[+1,+2]];
                else if (is(change, [Facing.SOUTH, Facing.EAST ])) trans = [[0,0],[-1,0],[-1,+1],[0,-2],[-1,-2]];
                else if (is(change, [Facing.SOUTH, Facing.WEST ])) trans = [[0,0],[+1,0],[+1,+1],[0,-2],[+1,-2]];
                else if (is(change, [Facing.WEST, Facing.SOUTH ])) trans = [[0,0],[-1,0],[-1,-1],[0,+2],[-1,+2]];
                else if (is(change, [Facing.WEST, Facing.NORTH ])) trans = [[0,0],[-1,0],[-1,-1],[0,+2],[-1,+2]];
            } else /* TetriminoType.I */ {
                     if (is(change, [Facing.NORTH, Facing.EAST ])) trans = [[0,0],[-2,0],[+1,0],[-2,-1],[+1,+2]];
                else if (is(change, [Facing.NORTH, Facing.WEST ])) trans = [[0,0],[-1,0],[+2,0],[-1,+2],[+2,-1]];
                else if (is(change, [Facing.EAST,  Facing.NORTH])) trans = [[0,0],[+2,0],[-1,0],[+2,+1],[-1,-2]];
                else if (is(change, [Facing.EAST,  Facing.SOUTH])) trans = [[0,0],[-1,0],[+2,0],[-1,+2],[+2,-1]];
                else if (is(change, [Facing.SOUTH, Facing.EAST ])) trans = [[0,0],[+1,0],[-2,0],[+1,-2],[-2,+1]];
                else if (is(change, [Facing.SOUTH, Facing.WEST ])) trans = [[0,0],[+2,0],[-1,0],[+2,+1],[-1,-2]];
                else if (is(change, [Facing.WEST, Facing.SOUTH ])) trans = [[0,0],[-2,0],[+1,0],[-2,-1],[+1,+2]];
                else if (is(change, [Facing.WEST, Facing.NORTH ])) trans = [[0,0],[+1,0],[-2,0],[+1,-2],[-2,+1]];
            }
        
            for (const translation of trans) {
                let valid = true;
            
                {
                    // Only rotate if the rotation is valid after the translation (which can notably be [0,0])
                    valid = valid && this.move(translation);
                    valid = valid && this.rotate(Rotation.SIMPLE, direction);
                }
            
                if (valid) {
                    if (this.game.session.user.config.developer.logging.rotate) {
                        console.log(`Rotated (super) in ${+Date.now() - t}ms`);
                    }

                    this.invalidateZenithMemo();

                    return true;
                } else {
                    this.pixels = stasis[0];
                    this.facing = change[0];
                    this.x = stasis[1];
                    this.y = stasis[2];
                }
            }

        
            return false;
        }

        throw new Error("Invalid rotation type provided!");
    }

    public colors () {
        return this.game.session.user.theme.tetriminos[this.type];
    }

    /**
      * Draws the tetrimino and it's ghost. If this piece is falling, it should only be called when necessary.
      * Note that the visual appearance of the tetrimino is deterministic on the state, notably the following:
      *   - Type of tetrimino
      *   - User configuration
      *   - Whether or not it has solidified
      *   - Whether or not is is being held
      */
    public draw () {
        setActiveCanvas(this.active ? "falling" : this.held ? "held" : "solid");
        setStrokeColor("#000000");
        setFillColor(this.game.session.user.theme.tetriminos[this.type][this.state]);

        // Size for each pixel based on the allocated size for the game board canvas, and the actual size of the game.
        const sizeX = ALLOCATED_WIDTH  / this.game.size[1][1];
        const sizeY = ALLOCATED_HEIGHT / this.game.size[0][1];
        const shouldDrawRelative = this.active || this.held;

        // Draw the tetrimino
        this.pixels.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (shouldDrawRelative ? pixel : pixel && pixel.solid) {
                    rect(
                        (shouldDrawRelative ? x : this.x + x - (this.game.size[1][0] - this.game.size[1][1])) * sizeX,
                        (shouldDrawRelative ? y : this.y + y - (this.game.size[0][0] - this.game.size[0][1])) * sizeY,
                        sizeX,
                        sizeY,
                    );
                }
            });
        });

        if (!this.active) return;

        setActiveCanvas("ghost");
        setStrokeColor("#000000");
        setFillColor(this.game.session.user.theme.tetriminos[this.type]["GHOST"]);

        // Draw the tetrimino
        this.pixels.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    rect(
                        x * sizeX,
                        y * sizeY,
                        sizeX,
                        sizeY,
                    );
                }
            });
        });
    }

    /**
     * Clears the active tetrimino's canvas alongside it's ghost's.
     */
    public clear () {
        if (this.active) {
            setActiveCanvas("falling");
            clearCanvas();
            setActiveCanvas("ghost");
            clearCanvas();
        } else {
            setActiveCanvas("held");
            clearCanvas();
        }
    }

    /**
     * Moves the active tetrimino's canvas alongside it's ghost's.
     */
    public moveCanvas () {
        const sizeX = ALLOCATED_WIDTH  / this.game.size[1][1];
        const sizeY = ALLOCATED_HEIGHT / this.game.size[0][1];
        const zenith = this.zenith();
        
        setPosition(
            "falling",
            (this.x - (this.game.size[1][0] - this.game.size[1][1])) * sizeX,
            (this.y - (this.game.size[0][0] - this.game.size[0][1])) * sizeY,
        );

        setPosition(
            "ghost",
            (this.x - (this.game.size[1][0] - this.game.size[1][1])) * sizeX,
            (zenith - (this.game.size[0][0] - this.game.size[0][1])) * sizeY,
        );
    }

    public hardDrop () {
        const depth = this.zenith() - this.y;
        console.log(depth);
        while (this.move([0, depth])) { 
            // NOOP - Self terminating movement loop.
        }
        
        this.moveCanvas();
    }

    private zenithMemoValid = false;
    private zenithMemo!: number;

    public invalidateZenithMemo () {
        this.zenithMemoValid = false;
    }   

    /**
     * @returns the highest safe point this tetrimino can be dropped, that point being the `y` of the tetrimino if it were dropped to that position
     * 
     * @remarks
     *  - TODO: This is very ineffecient.
     *  - TODO: Memoize the function.
     */
    public zenith () {
        // If it is still valid, return the cached version.
        if (this.zenithMemoValid) return this.zenithMemo;

        // Save our current position to revert
        const stasis = this.y;

        // Save a timestamp for performance logging and analysis
        const timestamp = +Date.now();

        // Drop until we can no longer move downwards.
        while (this.move([0, +1])) { /* NOOP */ }

        // Save our zenith to return after we revert our position
        const zenith = this.y;

        // Revert our movement
        this.y = stasis;

        // Cache and memoize the zenith result, indiciating it is ready.
        this.zenithMemoValid = true;
        this.zenithMemo = zenith;

        // Log how long it took to calculate the zenith
        if (this.game.session.user.config.developer.logging.zenith) {
            console.log(`Zenith calculated in ${+Date.now() - timestamp}ms`);
        }

        // Return the zenith
        return zenith;
    }

    // #region serde
    public serialize () {
        return [this.type, [this.active, this.held], this.state, this.facing, [this.x, this.y]] as const;
    }

    public static deserialize (game: Game, data: ReturnType<Tetrimino["serialize"]>) {
        const tetrimino = new Tetrimino(data[4][0], data[4][1], game, data[2], data[0]);
        tetrimino.facing = data[3];
        tetrimino.active = data[1][0];
        tetrimino.held = data[1][1];
        return tetrimino;
    }
    // #endregion serde
}
