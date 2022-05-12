import { Session } from "../Session";

export function setupGamePage (session: Session) {
    onEvent("details-btn", "click", () => {
        session.game.pause();
        setScreen("details");
    });

    setText("version-and-license", getText("version-and-license")
        .replace("[TIMESTAMP]", _BUILD_TIMESTAMP)
        .replace("[VERSION]", _VERSION)
        .replace("[LICENSE]", _LICENSE)
    );

    onEvent("version-and-license", "click", () => {
        console.log("BUILD_ENVIRONMENT: " + _BUILD_ENVIRONMENT);
        console.log("BUILD_TIMESTAMP: " + _BUILD_TIMESTAMP);
        console.log("Thanks for playing!");
    });
}
