import { create as randomSeed, RandomSeed } from "random-seed";
import { Peer, NetworkMode, MessageFactory, PeerOptions, createClient, createHost } from "p2p-networking";
import { addSeconds, differenceInSeconds, isAfter } from "date-fns";
import { computed, action, observable } from "mobx";
import { component } from "tsdi";
import {
    GameConfig,
    GameState,
    MessageType,
    AppUser,
    MessageStartGame,
    MessageChangeConfig,
    MessageNextRound,
    MessageEndRound,
    MessageSolution,
    MessageScoreWord,
    MessageAcceptSolutions,
    MessageWelcome,
    ScoreType,
    Validation,
    Letter,
} from "./types";
import { v4 } from "uuid";
import { generateUserName, allLetters } from "./utils";

export interface Score {
    rank: number;
    score: number;
    playerName: string;
    playerId: string;
}

export const enum LoadingFeatures {
    START_GAME = "start game",
    NEXT_ROUND = "next round",
    END_ROUND = "end round",
    ACCEPT_SOLUTIONS = "accept solutions",
    SCORE_WORD = "score word",
}

@component
export class Game {
    @observable public config: GameConfig = {
        seed: v4(),
        categories: ["Stadt", "Land", "Fluss"],
    };
    @observable public state = GameState.LOBBY;
    @observable.shallow public peer: Peer<AppUser, MessageType> | undefined;
    @observable public turn = 0;
    @observable public totalScores = new Map<string, number>();
    @observable public loading = new Set<LoadingFeatures>();

    @observable public solutions = new Map<string, Map<string, string>>();
    @observable public currentScores = new Map<string, Map<string, ScoreType>>();

    @observable public currentLetter = Letter.A;
    @observable public usedLetters = new Set<Letter>();

    private rng?: RandomSeed;

    private messageWelcome?: MessageFactory<MessageType, MessageWelcome>;
    private messageChangeConfig?: MessageFactory<MessageType, MessageChangeConfig>;
    private messageStartGame?: MessageFactory<MessageType, MessageStartGame>;
    private messageNextRound?: MessageFactory<MessageType, MessageNextRound>;
    private messageEndRound?: MessageFactory<MessageType, MessageEndRound>;
    private messageSolution?: MessageFactory<MessageType, MessageSolution>;
    private messageScoreWord?: MessageFactory<MessageType, MessageScoreWord>;
    private messageAcceptSolutions?: MessageFactory<MessageType, MessageAcceptSolutions>;

    @computed public get userName(): string {
        return this.user?.name ?? "";
    }

    @computed public get userId(): string {
        return this.peer?.userId ?? "";
    }

    @computed public get solution(): Map<string, string> | undefined {
        return this.solutions.get(this.userId);
    }

    @computed public get scoreList(): Score[] {
        return Array.from(this.totalScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([playerId, score]) => ({ playerId, playerName: this.getUser(playerId)?.name ?? "", score }))
            .map(({ playerName, playerId, score }, index) => ({
                rank: index + 1,
                score,
                playerName,
                playerId,
            }));
    }

    @computed public get user(): AppUser | undefined {
        return this.peer?.user;
    }

    @computed public get users(): AppUser[] | undefined {
        return this.peer?.users;
    }

    public getUser(userId: string): AppUser | undefined {
        return this.users?.find((user) => user.id === userId);
    }

    public getRank(playerId: string): number {
        return this.scoreList.find((entry) => entry.playerId === playerId)?.rank ?? 0;
    }

    @computed public get networkMode(): NetworkMode {
        return this.peer?.networkMode ?? NetworkMode.DISCONNECTED;
    }

    @action.bound public async sendStartGame(): Promise<void> {
        if (!this.messageStartGame) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.START_GAME);
        await this.messageStartGame.send({ config: this.config }).waitForAll();
        this.loading.delete(LoadingFeatures.START_GAME);
    }

    @action.bound public changeConfig(config: GameConfig): void {
        if (!this.messageChangeConfig) {
            throw new Error("Network not initialized.");
        }
        this.messageChangeConfig.send({ config });
    }

    @action.bound public async sendNextRound(): Promise<void> {
        if (!this.messageNextRound) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.NEXT_ROUND);
        await this.messageNextRound.send({ config: this.config }).waitForAll();
        this.loading.delete(LoadingFeatures.NEXT_ROUND);
    }

    @action.bound public async sendEndRound(): Promise<void> {
        if (!this.messageEndRound) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.END_ROUND);
        await this.messageEndRound.send({ config: this.config }).waitForAll();
        this.loading.delete(LoadingFeatures.END_ROUND);
    }

    @action.bound public sendSolution(): void {
        if (!this.messageSolution) {
            throw new Error("Network not initialized.");
        }
        this.messageSolution.send({ solution: Array.from(this.solution?.entries() ?? []) });
    }

    @action.bound public async sendScoreWord(userId: string, category: string, scoreType: ScoreType): Promise<void> {
        if (!this.messageScoreWord) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.SCORE_WORD);
        await this.messageScoreWord.send({ userId, category, scoreType }).waitForAll();
        this.loading.delete(LoadingFeatures.SCORE_WORD);
    }

    @action.bound public async sendAcceptSolutions(): Promise<void> {
        if (!this.messageAcceptSolutions) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.ACCEPT_SOLUTIONS);
        await this.messageAcceptSolutions.send({}).waitForAll();
        this.loading.delete(LoadingFeatures.ACCEPT_SOLUTIONS);
    }

    @computed public get validation(): Validation {
        const categoryErrors = new Map<string, string>();
        if (!this.solution) {
            throw new Error("Game not started.");
        }
        for (const [category, word] of this.solution) {
            if (word.trim() === "") {
                categoryErrors.set(category, "Word cannot be empty.");
                continue;
            }
            if (word.trim().toLowerCase()[0] !== this.currentLetter) {
                categoryErrors.set(category, "Wrong first letter.");
            }
        }
        if (categoryErrors.size === 0) {
            return { valid: true };
        }
        return { valid: false, categoryErrors };
    }

    @computed public get canEndTurn(): boolean {
        return this.validation.valid;
    }

    @computed public get availableLetters(): Set<Letter> {
        const result = new Set(allLetters);
        for (const letter of this.usedLetters) {
            result.delete(letter);
        }
        return result;
    }

    @action.bound private startTurn(): void {
        if (!this.rng) {
            throw new Error("Game not started.");
        }
        this.currentScores.clear();
        this.currentLetter = Array.from(this.availableLetters.values())[
            this.rng.intBetween(0, this.availableLetters.size)
        ];
        this.usedLetters.add(this.currentLetter);
        this.solutions.clear();
        if (!this.peer) {
            throw new Error("Network not initialized.");
        }
        for (const { id } of this.peer.users) {
            const map = new Map<string, string>();
            for (const category of this.config.categories) {
                map.set(category, "");
            }
            this.solutions.set(id, map);
        }
        this.state = GameState.GUESS;
    }

    public getWord(userId: string, category: string): string {
        return this.solutions.get(userId)?.get(category)?.trim().toLowerCase() ?? "";
    }

    public getAllWords(category: string): Map<string, number> {
        const result = new Map<string, number>();
        for (const [userId, solution] of this.solutions) {
            const word = solution.get(category) ?? "";
            const trimmed = word.trim().toLowerCase();
            if (!trimmed || trimmed.length === 0) {
                continue;
            }
            result.set(trimmed, (result.get(trimmed) ?? 0) + 1);
        }
        return result;
    }

    @action.bound private setScore(userId: string, category: string, score: ScoreType): void {
        if (!this.currentScores.has(userId)) {
            this.currentScores.set(userId, new Map());
        }
        const userScores = this.currentScores.get(userId)!;
        userScores.set(category, score);
    }

    private precalculateScores(): void {
        for (const category of this.config.categories) {
            const allWords = this.getAllWords(category);
            for (const { id: userId } of this.users ?? []) {
                const word = this.getWord(userId, category);
                if (!word) {
                    this.setScore(userId, category, ScoreType.NONE);
                } else if (allWords.size === 1) {
                    this.setScore(userId, category, ScoreType.ONLY);
                } else if (allWords.get(word) === 1) {
                    this.setScore(userId, category, ScoreType.UNIQUE);
                } else {
                    this.setScore(userId, category, ScoreType.DUPLICATE);
                }
            }
        }
    }

    @action.bound public async initialize(networkId?: string): Promise<void> {
        const options: PeerOptions<AppUser> = {
            applicationProtocolVersion: "0.0.0",
            peerJsOptions: {
                host: "peerjs.92k.de",
                secure: true,
            },
            user: {
                name: generateUserName(),
            },
        };
        this.peer =
            typeof networkId === "string"
                ? await createClient(options, networkId)
                : await createHost({ ...options, pingInterval: 10 });
        this.messageWelcome = this.peer.message<MessageWelcome>(MessageType.WELCOME);
        this.messageChangeConfig = this.peer.message<MessageChangeConfig>(MessageType.CHANGE_CONFIG);
        this.messageStartGame = this.peer.message<MessageStartGame>(MessageType.START_GAME);
        this.messageNextRound = this.peer.message<MessageNextRound>(MessageType.NEXT_ROUND);
        this.messageEndRound = this.peer.message<MessageEndRound>(MessageType.END_ROUND);
        this.messageSolution = this.peer.message<MessageSolution>(MessageType.SOLUTION);
        this.messageScoreWord = this.peer.message<MessageScoreWord>(MessageType.SCORE_WORD);
        this.messageAcceptSolutions = this.peer.message<MessageAcceptSolutions>(MessageType.ACCEPT_SOLUTIONS);

        this.messageWelcome.subscribe(({ config }) => (this.config = config));
        this.messageChangeConfig.subscribe(({ config }) => (this.config = config));
        this.messageStartGame.subscribe(({ config }) => {
            this.config = config;
            this.rng = randomSeed(config.seed);
            this.startTurn();
        });
        this.messageNextRound.subscribe(() => {
            this.turn++;
            this.startTurn();
        });
        this.messageEndRound.subscribe(() => {
            this.state = GameState.SCORING;
            this.sendSolution();
        });
        this.messageSolution.subscribe(({ solution }, userId) => {
            this.solutions.set(userId, new Map(solution));
            if (!this.users) {
                throw new Error("Network not initialized.");
            }
            if (this.solutions.size === this.users.length) {
                this.precalculateScores();
            }
        });
        this.messageScoreWord.subscribe(({ userId, category, scoreType }) => {
            const userScore = this.currentScores.get(userId);
            if (!userScore) {
                throw new Error("Score not present.");
            }
            userScore.set(category, scoreType);
        });
        this.messageAcceptSolutions.subscribe(({}) => {
            for (const [userId, scores] of this.currentScores) {
                const sum = Array.from(scores.values()).reduce((result, current) => result + current, 0);
                const userTotalScore = this.totalScores.get(userId) ?? 0;
                this.totalScores.set(userId, userTotalScore + sum);
            }
            this.state = GameState.SCORES;
        });
    }
}
