import type { Session } from "../Session";
import { ALLOCATED_HEIGHT, ALLOCATED_WIDTH } from "./sizes";
import { setupDetailsPage } from "../ui/details";
import { setupOptionsPage } from "../ui/options";
import { setupGamePage } from "../ui/game";

function createPieceDisplayCanvas (session: Session, id: string) {
    createCanvas(id,
        (ALLOCATED_WIDTH / session.game.size[1][1]) * 4,
        (ALLOCATED_HEIGHT / session.game.size[0][1]) * 4,
    );
}

export function setupUserInterface (session: Session) {
    createCanvas("solid", ALLOCATED_WIDTH, ALLOCATED_HEIGHT);
    createPieceDisplayCanvas(session, "falling");
    createPieceDisplayCanvas(session, "ghost");
    setupDetailsPage(session);
    setupOptionsPage(session);
    setupGamePage(session);
}
