import type { Session } from "../Session";
import type { Game } from "../Game";
import { ALLOCATED_HEIGHT, ALLOCATED_WIDTH } from "./sizes";
import { setupDetailsPage } from "../ui/details";
import { setupOptionsPage } from "../ui/options";
import { setupGamePage } from "../ui/game";

function drawLines (game: Game) {
    const sizeX = ALLOCATED_WIDTH /  game.size[1][1];
    const sizeY = ALLOCATED_HEIGHT / game.size[0][1];

    createCanvas("lines", ALLOCATED_WIDTH, ALLOCATED_HEIGHT);
    setActiveCanvas("lines");
    setStrokeColor("#dedede");
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
    setStyle("lines", "z-index: -25");
    setStyle("game-background", "z-index: -30");
    createCanvas("solid", ALLOCATED_WIDTH, ALLOCATED_HEIGHT);
    createCanvas("falling",
        (300 / session.game.size[1][1]) * 4,
        (450 / session.game.size[0][1]) * 4,
    );

    setupDetailsPage(session);
    setupOptionsPage(session);
    setupGamePage(session);
}
