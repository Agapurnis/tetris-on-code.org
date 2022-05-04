import type { Session } from "../Session";
import { prettyifyJson } from "../util/prettifyJson";

export function setupOptionsPage (session: Session) {
    onEvent("options-ret-btn", "click", () => {
        setScreen("details");
    });

    onEvent("options-export", "click", () => {
        const data = prettyifyJson(JSON.stringify(session.serialize()));
        setText("options-savedata", data);
    });
}
