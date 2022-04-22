import { Session } from "./Session";
import { User } from "./User";

const DEV = {
    developer: {
        draw: true,
        logging: {
            tick: true,
            rotate: true,
        }
    }
};

const user = new User(getUserId(), "TestAccount", DEV);
const session = new Session(user);

session.game.start();

setInterval(() => {
    // console.log(session.game.active?.x, session.game.active?.y);
}, 100);
