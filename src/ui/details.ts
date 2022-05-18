import type { Session } from "../Session";

export function setupDetailsPage (session: Session) {
    onEvent("details-ret-btn", "click", () => {
        setScreen("game");
        setText("held-lock-state", session.game.held ? "❌" : "✔️");
        session.game.active?.clear();
        session.game.active?.draw();
        session.game.active?.moveCanvas();
        session.game.held?.draw();
        session.game.clear();
        session.game.draw();
        session.game.unpause();
    });

    onEvent("github-repository-btn", "click", () => {
        open("https://github.com/Agapurnis/tetris-on-code.org");
    });

    onEvent("options-btn", "click", () => {
        setScreen("options");
    });
}
