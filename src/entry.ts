import { Session } from "./Session";
import { User } from "./User";

const user = new User(getUserId(), "TestAccount", { developer: { logging: { tick: true, rotate: true }}});
const session = new Session(user);

session.game.start();

setInterval(() => {
    // console.log(session.game.active?.x, session.game.active?.y);
}, 100);
