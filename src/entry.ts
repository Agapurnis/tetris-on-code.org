import { setupUserInterface } from "./util/setupUserInterface";
import { Session } from "./Session";
import { User } from "./User";

const user = new User(getUserId(), "TestAccount");
const session = new Session(user);

setupUserInterface(session);
session.game.start();

setInterval(() => {
    // console.log(session.game.active?.x, session.game.active?.y);
}, 100);
