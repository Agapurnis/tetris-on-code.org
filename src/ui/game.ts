import type { Game } from "../Game";
import type { Session } from "../Session";
import { TETRIMINO_PIXEL_STATES } from "../Tetrimino";
import { ALLOCATED_HEIGHT, ALLOCATED_WIDTH } from "../util/sizes";

function drawBoardLines (game: Game) {
    const sizeX = ALLOCATED_WIDTH /  game.size[1][1];
    const sizeY = ALLOCATED_HEIGHT / game.size[0][1];

    createCanvas("board-lines", ALLOCATED_WIDTH, ALLOCATED_HEIGHT);
    setActiveCanvas("board-lines");
    setStrokeColor("#dedede");
    setStrokeWidth(2);

    for (let i = 0; i < game.size[0][1]; i++) {
        line(0, i * sizeY, sizeX * game.size[1][1], i * sizeY);
    }

    for (let i = 0; i < game.size[1][1]; i++) {
        line(i * sizeX, 0, i * sizeX, sizeY * game.size[0][1]);
    }
}

function drawHeldLines (game: Game) {
    const sizeX = ALLOCATED_WIDTH /  game.size[1][1];
    const sizeY = ALLOCATED_HEIGHT / game.size[0][1];

    const travel = Object.keys(TETRIMINO_PIXEL_STATES)
        .map((k) => TETRIMINO_PIXEL_STATES[k as unknown as keyof typeof TETRIMINO_PIXEL_STATES])
        .map((v) => Math.max(v.length, v[0].length))
        .reduce((a, b) => b > a ? b : a, 0);

    createCanvas("held-lines", ALLOCATED_WIDTH, ALLOCATED_HEIGHT);
    setPosition("held-lines", getXPosition("held"), getYPosition("held"));
    setActiveCanvas("held-lines");
    setStrokeColor("#4d4d4d");
    setStrokeWidth(2);

    for (let i = 0; i < travel; i++) {
        line(0, i * sizeY, sizeX * travel, i * sizeY);
    }

    for (let i = 0; i < travel; i++) {
        line(i * sizeX, 0, i * sizeX, sizeY * travel);
    }
} 

export function setupGamePage (session: Session) {
    drawBoardLines(session.game);
    drawHeldLines(session.game);
    setStyle("held-bg", "z-index: -25");
    setStyle("held-lines", "z-index: -25");
    setStyle("board-lines", "z-index: -25");
    setStyle("game-background", "z-index: -30");

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
