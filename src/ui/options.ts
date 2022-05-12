import { Session } from "../Session";
import { recursiveAssign } from "../util/recursiveAssign";

export function setupOptionsPage (session: Session) {
    onEvent("options-ret-btn", "click", () => {
        setScreen("details");
    });

    onEvent("options-export", "click", () => {
        const data = JSON.stringify(session.serialize());
        setText("options-savedata", data);
    });

    onEvent("options-import", "click", () => {
        session.update(recursiveAssign(session.serialize(), JSON.parse(getText("options-savedata").replace(/\n/g, "")) as ReturnType<Session["serialize"]>));
    });
}
