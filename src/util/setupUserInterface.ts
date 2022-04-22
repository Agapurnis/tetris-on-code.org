import type { Session } from "../Session";
import type { Game } from "../Game";
// import type { User } from "../User";
import { ALLOCATED_HEIGHT, ALLOCATED_WIDTH } from "./sizes";

function drawLines (game: Game) {
    const sizeX = ALLOCATED_WIDTH /  game.size[1][1];
    const sizeY = ALLOCATED_HEIGHT / game.size[0][1];

    setStrokeColor("#e3e3e3");
    setStrokeWidth(2);

    for (let i = 0; i < game.size[0][1]; i++) {
        line(0, i * sizeY, sizeX * game.size[1][1], i * sizeY);
    }

    for (let i = 0; i < game.size[1][1]; i++) {
        line(i * sizeX, 0, i * sizeX, sizeY * game.size[0][1]);
    }
}

export function setupUserInterface (session: Session) {
    drawLines(session.game);
    setStyle("game-background", "z-index: -30");
}
