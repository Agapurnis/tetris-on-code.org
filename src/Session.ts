import { setupUserInterface } from "./util/setupUserInterface";
import { Game } from "./Game";
import { User } from "./User";

export class Session {
    constructor (
        public user: User,
    ) {
        setupUserInterface(user);
    }

    public game = new Game(this);
}
