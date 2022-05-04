import { setupUserInterface } from "./util/setupUserInterface";
import { Game } from "./Game";
import { User } from "./User";

export class Session {
    constructor (
        public user: User,
    ) {
        setupUserInterface(this);
    }

    public game = new Game(this);

    // #region serde
    public serialize () {
        return {
            user: this.user,
            game: {
                board: this.game.board,
            }
        };
    }

    // #endregion serde
    
}
