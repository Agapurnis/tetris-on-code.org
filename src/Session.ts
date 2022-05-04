import { Game } from "./Game";
import { User } from "./User";

export class Session {
    constructor (
        public user: User,
    ) {}

    public game = new Game(this);

    // #region serde
    public serialize () {
        return {
            user: this.user.serialize(),
            game: this.game.serialize()
        };
    }

    public static deserialize (data: ReturnType<Session["serialize"]>) {
        const session = new Session(User.deserialize(data.user));
        session.game = Game.deserialize(data.game);
        return session;
    }
    // #endregion serde
    
}
