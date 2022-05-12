import { Game } from "./Game";
import { User } from "./User";

export class Session {
    constructor (
        public user: User,
    ) {}

    public game = new Game(this);

    // #region serde, mut
    public serialize () {
        return {
            user: this.user.serialize(),
            game: this.game.serialize()
        };
    }

    public update (data: ReturnType<Session["serialize"]>) {
        this.user.update(data.user);
        this.game.update(data.game);
    } 

    public static deserialize (data: ReturnType<Session["serialize"]>) {
        const session = new Session(User.deserialize(data.user));
        session.game = Game.deserialize(data.game);
        return session;
    }
    // #endregion serde, mut
    
}
