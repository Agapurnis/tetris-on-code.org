import type { Game } from "./Game";
import { Direction, Rotation  } from "./Tetrimino";

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
        ["press", ["p"], (game: Game) => game.paused ? game.unpause() : game.pause()],
        ["press", ["c"], (game: Game) => game.trySwapHeld()],
        ["press", [" "], (game: Game) => game.active?.hardDrop()],
        ["press", ["a"], (game: Game) => game.active?.move([-1,  0]) && game.active?.moveCanvas()],
        ["press", ["d"], (game: Game) => game.active?.move([+1,  0]) && game.active?.moveCanvas()],
        ["press", ["s"], (game: Game) => game.active?.move([ 0, +1]) && game.active?.moveCanvas()],
        ["press", ["z", "q"], (game: Game) => game.active?.rotate(Rotation.SUPER, Direction.COUNTERCLOCKWISE) && (game.active?.clear(), game.active?.draw())],
        ["press", ["x", "e"], (game: Game) => game.active?.rotate(Rotation.SUPER, Direction.CLOCKWISE       ) && (game.active?.clear(), game.active?.draw())],
    ] as const; // TODO
    // #endregion Static Mappings
}
