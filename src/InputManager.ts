import { Game } from "./Game";

export type InputMapping =
    | [type: "press", key: string, action: (game: Game) => void]
    | [type: "click", id: string, event: "mousedown", action: (game: Game) => void];

export class InputManager {
    public constructor (
        public readonly holder: Game,
        public readonly mappings: InputMapping[],
    ) {}


    public listen () {
        // TODO
    }

    // #region Static Mappings
    public static readonly DEFAULT_MAPPINGS = []; // TODO
    // #endregion Static Mappings
}
