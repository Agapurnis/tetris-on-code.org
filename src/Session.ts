import { Game } from "./Game";
import { User } from "./User";

export class Session {
    constructor (
        public user: User,
    ) {}

    public game = new Game(this);
}
