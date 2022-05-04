import { Session } from "../Session";

export function setupGamePage (session: Session) {
    onEvent("details-btn", "click", () => {
        session.game.pause();
        setScreen("details");
    });
}
