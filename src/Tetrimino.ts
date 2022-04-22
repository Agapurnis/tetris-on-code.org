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
        this.game.tetriminos.push(this);
        this.pixels = TETRIMINO_PIXEL_STATES[this.type]
            // Convert all pixel states to actual pixels for this tetrimino with correct positioning.
            .map((row, y) => row.map((pixel, x) => Pixel.forTetrimino(this, [this.x + x, this.y + y], pixel)));

        createCanvas(this.canvas,
            (300 / this.game.size[1][1]) * 4,
            (450 / this.game.size[0][1]) * 4,
        );
    }
        
    public shouldDraw = true;
    public pixels: Pixel[][];
    public facing = Facing.NORTH;
    public canvas = (+Date.now()).toString(); // lol good enough, very unique
    public active = false;
    public held   = false;

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

                if (pixel.tetrimino !== null) {
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

        // Now that we know this move is valid,
        // we can return without needing to rollback.
        return true;
    }

    /**
      * @throws if the tetrimino is already solidified
      * @remarks does not mark as inactive
      */
    public solidify () {
        this.state = TetriminoState.SOLID;
        this.shouldDraw = true;
        this.pixels.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel.solid) throw new Error("Cannot solidify already solid pixel!");
                if (pixel.tetrimino !== null && pixel.falling) {
                    pixel.falling = false;
                    pixel.solid = true;
                    if (this.game.board[this.y + y]?.[this.x + x] === null) {
                        this.game.board[this.y + y]  [this.x + x] = pixel;
                    }
                }
            });
        });
    }

    public rotate (rotation: Rotation, direction: Direction): boolean {
        const t = +Date.now();
        this.shouldDraw = true;

        if (rotation === Rotation.SIMPLE) {
            const rotated: Pixel[][] = [];

            for (let col = 0; col < this.pixels[0].length; col++) {
              const temp: Pixel[] = [];
        
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
                    valid = valid && this.move(translation);
                    valid = valid && this.rotate(Rotation.SIMPLE, direction);
                }
            
                if (valid) {
                    if (this.game.session.user.config.developer.logging.rotate) {
                        console.log(`Rotated (super) in ${+Date.now() - t}ms`);
                    }

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

    /**
      * Draws the tetrimino. If this piece is falling, it *should only be called once unless a rotation is preformed*.
      * Note that the visual appearance of the tetrimino is deterministic on the state, notably the following:
      *   - Type of tetrimino
      *   - User configuration
      *   - Whether or not it has solidified
      */
    public drawCanvas () {
        if (!this.shouldDraw) return;

        setActiveCanvas(this.canvas); clearCanvas();
        setFillColor(this.game.session.user.theme.tetriminos[this.type][this.state]);

        const sizeX = ALLOCATED_WIDTH  / this.game.size[1][1];
        const sizeY = ALLOCATED_HEIGHT / this.game.size[0][1];

        // Draw the tetrimino
        this.pixels.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel.tetrimino === null) return;
                if (pixel.solid || pixel.falling) {
                    rect(
                        x * sizeX,
                        y * sizeY,
                        sizeX,
                        sizeY,
                    );
                }

            });
        });

        this.shouldDraw = false;
    }

    public moveCanvas () {
        const sizeX = ALLOCATED_WIDTH  / this.game.size[1][1];
        const sizeY = ALLOCATED_HEIGHT / this.game.size[0][1];
        
        // let dirty = false;
        // const tOffset = TETRIMINO_PIXEL_STATES[this.type].filter((row) => row.every((pixel) => pixel === PixelState.VOID)).length;
        const sOffset = [
            this.game.size[1][0] - this.game.size[1][1],
            this.game.size[0][0] - this.game.size[0][1],
        ];
        
        setPosition(
            this.canvas,
            (this.x - sOffset[0]) * sizeX,
            (this.y - sOffset[1]) * sizeY,
        );
    }

    public hardDrop () {
        while (this.move([0, +1])) { 
            // NOOP - Self terminating movement loop.
        }
        
        this.moveCanvas();
    }
}
