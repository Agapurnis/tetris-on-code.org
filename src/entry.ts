import { Session } from "./Session";
import { User } from "./User";

const user = new User(getUserId());
const session = new Session(user);

session.game.start();
