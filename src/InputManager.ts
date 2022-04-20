import { Game } from "./Game";
import { Direction, Rotation } from "./Tetrimino";

export type InputMapping =
    | readonly [type: "press", key: readonly string[], action: (game: Game) => void]
    | readonly [type: "click", id: string, event: "mousedown", action: (game: Game) => void];

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
                        mapping[2](this.holder);
                    }
                });
            }
        });
    }

    // #region Static Mappings
    public static readonly DEFAULT_MAPPINGS = [
        ["press", ["a"], (game: Game) => game.active?.move([-1,  0]) && game.active?.moveCanvas()],
        ["press", ["d"], (game: Game) => game.active?.move([+1,  0]) && game.active?.moveCanvas()],
        ["press", ["s"], (game: Game) => game.active?.move([ 0, +1]) && game.active?.moveCanvas()],
        ["press", ["z", "q"], (game: Game) => game.active?.rotate(Rotation.SUPER, Direction.COUNTERCLOCKWISE) && game.active?.drawCanvas()],
        ["press", ["x", "e"], (game: Game) => game.active?.rotate(Rotation.SUPER, Direction.CLOCKWISE       ) && game.active?.drawCanvas()],
    ] as const; // TODO
    // #endregion Static Mappings
}
