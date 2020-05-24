import { GameConfig } from "./game-config";

export const enum ScoreType {
    NONE = 0,
    DUPLICATE = 5,
    UNIQUE = 10,
    ONLY = 20,
}

export const enum MessageType {
    WELCOME = "welcome",
    CHANGE_CONFIG = "change config",
    START_GAME = "start game",
    NEXT_ROUND = "next round",
    END_ROUND = "end round",
    SOLUTION = "solution",
    SCORE_WORD = "score word",
    ACCEPT_SOLUTIONS = "accept solutions",
    TOUCH_CATEGORY = "touch category",
}

export interface MessageWelcome {
    config: GameConfig;
}

export interface MessageChangeConfig {
    config: GameConfig;
}

export interface MessageStartGame {
    config: GameConfig;
}

export interface MessageNextRound {}

export interface MessageEndRound {}

export interface MessageSolution {
    solution: [string, string][];
}

export interface MessageScoreWord {
    userId: string;
    category: string;
    scoreType: ScoreType;
}

export interface MessageAcceptSolutions {}

export interface MessageTouchCategory {
    category: string;
}
