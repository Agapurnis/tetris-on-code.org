import type { Session } from "../Session";

export function setupSettingsPage (session: Session) {
    onEvent("details-ret-btn", "click", () => {
        setScreen("game");
        session.game.unpause();
    });

    onEvent("options-btn", "click", () => {
        setScreen("options");
    });
}
