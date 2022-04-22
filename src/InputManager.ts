import type { Game } from "./Game";
import { Pixel } from "./Pixel";
import { Direction, Rotation } from "./Tetrimino";
import { ALLOCATED_HEIGHT, ALLOCATED_WIDTH } from "./util/sizes";

createCanvas("drawn", ALLOCATED_WIDTH, ALLOCATED_HEIGHT);

let drawingEvent: ApplabMouseEvent;
let drawingActive = false;
let drawingInterval: number;

export type InputMapping =
    | readonly [type: "press", key: readonly string[], action: (game: Game, event: KeyboardEvent) => void]
    | readonly [type: "click", ids: readonly string[], event: "mousedown" | "mouseup" | "mousemove", action: (game: Game, event: ApplabMouseEvent) => void];

export class InputManager {
    public constructor (
        public readonly holder: Game,
        public readonly mappings: InputMapping[] | readonly InputMapping[],
    ) {}


    public listen () {
        this.mappings.forEach((mapping) => {
            if (mapping[0] === "press") {
                onEvent("game", "keypress", (_event) => {
                    const event = _event as KeyboardEvent;
                    if (mapping[1].some((e) => e === event.key)) {
                        mapping[2](this.holder, event);
                    }
                });
            } else if (mapping[0] === "click") {
                onEvent("game", mapping[2], (_event) => {
                    const event = _event as ApplabMouseEvent;
                    if (mapping[1][0] === "*" ? true : mapping[1].some((e) => e === event.targetId)) {
                        mapping[3](this.holder, event);
                    }
                });
            }
        });
    }

    // #region Static Mappings
    public static readonly DEFAULT_MAPPINGS = [
        ["click", ["*"], "mousedown", () => drawingActive = true],
        ["click", ["*"], "mousemove", (game: Game, event: ApplabMouseEvent) => {
            if (drawingActive) drawingEvent = event;
            if (drawingActive) drawingInterval ??= setInterval(() => {
                if (!drawingActive) return;

                const sizeX = ALLOCATED_WIDTH /  game.size[1][1];
                const sizeY = ALLOCATED_HEIGHT / game.size[0][1];

                const offset = [
                    game.size[0][0] - game.size[0][1],
                    game.size[1][0] - game.size[1][1],
                ];

                if (game.session.user.config.developer.draw) {
                    // Drawing functionality for debugging sessions.
                    // To get the position of the pixel to place, we must round it based off the dimensions of the game board.
                    const x = Math.round(drawingEvent.x / sizeX);
                    const y = Math.round(drawingEvent.y / sizeY);
                    // Now we place a pixel at the rounded position.
                    // We'll need to have an active tetrimino to do this, otherwise it wont work.
                    if (game.board[y + offset[0]]?.[x + offset[1]] === null) {
                        const pixel = new Pixel([x, y], null);
                        pixel.solid = true;
                        setActiveCanvas("drawn");
                        rect(x * sizeX, y * sizeY, sizeX, sizeY);
                        game.board[y + offset[0]][x + offset[1]] = pixel;
                    }
                }
            }, 10) as unknown as number /* node typings bruh */;
        }],
        ["click", ["*"], "mouseup", () => {
            clearInterval(drawingInterval);
            drawingActive = false;
            drawingInterval = undefined as unknown as number;
        }],
        ["press", ["p"], (game: Game) => game.paused ? game.unpause() : game.pause()],
        ["press", [" "], (game: Game) => game.active?.hardDrop()],
        ["press", ["a"], (game: Game) => game.active?.move([-1,  0]) && game.active?.moveCanvas()],
        ["press", ["d"], (game: Game) => game.active?.move([+1,  0]) && game.active?.moveCanvas()],
        ["press", ["s"], (game: Game) => game.active?.move([ 0, +1]) && game.active?.moveCanvas()],
        ["press", ["z", "q"], (game: Game) => game.active?.rotate(Rotation.SUPER, Direction.COUNTERCLOCKWISE) && game.active?.drawCanvas()],
        ["press", ["x", "e"], (game: Game) => game.active?.rotate(Rotation.SUPER, Direction.CLOCKWISE       ) && game.active?.drawCanvas()],
    ] as const; // TODO
    // #endregion Static Mappings
}
