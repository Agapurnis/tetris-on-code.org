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
        recursiveAssign(session, Session.deserialize(JSON.parse(getText("options-savedata")) as ReturnType<Session["serialize"]>));
    });
}
