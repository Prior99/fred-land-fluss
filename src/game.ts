import { create as randomSeed, RandomSeed } from "random-seed";
import NomineLipsum from "nomine-lipsum";
import { MessageFactory, PeerOptions } from "p2p-networking";
import { ObservablePeer, createObservableClient, createObservableHost } from "p2p-networking-mobx";
import { computed, action, observable } from "mobx";
import { component, inject } from "tsdi";
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
    MessageWelcome,
    ScoreType,
    Validation,
    Letter,
    MessageTouchCategory,
    MessageSkipTurn,
    MessageAcceptScoring,
    MessageGameState,
} from "./types";
import { v4 } from "uuid";
import { allLetters, deserializeUserState, serializeUserState } from "./utils";
import {
    Audios,
    audioStartGame,
    audioPass,
    audioUnpass,
    audioCountdown,
    audioTickOwn,
    audioTickOtherPlayer,
    audioFinishedFirst,
    audioFinishedOther,
    audioAcceptWaiting,
    audioAcceptSelf,
    audioAcceptOther,
    audioAcceptReset,
} from "./audio";

declare const SOFTWARE_VERSION: string;

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
    SKIP = "skip",
}

export interface UserState {
    solutions: Map<string, string>;
    currentScores: Map<string, ScoreType>;
    touchedCategories: Set<string>;
    totalScore: number;
    skipped: boolean;
    hasAcceptedScore: boolean;
}

@component
export class Game {
    @inject private audios!: Audios;

    @observable.ref public peer: ObservablePeer<AppUser, MessageType> | undefined = undefined;
    @observable public config: GameConfig = {
        seed: v4(),
        categories: ["Stadt", "Land", "Fluss"],
    };

    @observable public state = GameState.LOBBY;
    @observable public deadline = Date.now();
    @observable public now = Date.now();
    @observable public round = 0;
    @observable public loading = new Set<LoadingFeatures>();
    @observable public userStates = new Map<string, UserState>();

    @observable public currentLetter = Letter.A;
    @observable public usedLetters = new Set<Letter>();

    private rng?: RandomSeed;

    private messageWelcome?: MessageFactory<MessageType, MessageWelcome>;
    private messageGameState?: MessageFactory<MessageType, MessageGameState>;
    private messageChangeConfig?: MessageFactory<MessageType, MessageChangeConfig>;
    private messageStartGame?: MessageFactory<MessageType, MessageStartGame>;
    private messageNextRound?: MessageFactory<MessageType, MessageNextRound>;
    private messageEndRound?: MessageFactory<MessageType, MessageEndRound>;
    private messageSolution?: MessageFactory<MessageType, MessageSolution>;
    private messageScoreWord?: MessageFactory<MessageType, MessageScoreWord>;
    private messageTouchCategory?: MessageFactory<MessageType, MessageTouchCategory>;
    private messageSkipTurn?: MessageFactory<MessageType, MessageSkipTurn>;
    private messageAcceptScoring?: MessageFactory<MessageType, MessageAcceptScoring>;

    @computed public get userName(): string {
        console.log(this.peer?.disconnectedUsers);
        return this.user?.name ?? "";
    }

    @computed public get solution(): Map<string, string> | undefined {
        return this.userStates.get(this.userId)?.solutions;
    }

    @computed public get userId(): string {
        return this.peer?.userId ?? "";
    }

    @computed public get scoreList(): Score[] {
        return Array.from(this.userStates.entries())
            .sort(([_idA, a], [_idB, b]) => b.totalScore - a.totalScore)
            .map(([playerId, { totalScore }]) => ({
                playerId,
                playerName: this.getUser(playerId)?.name ?? "",
                totalScore,
            }))
            .map(({ playerName, playerId, totalScore: score }, index) => ({
                rank: index + 1,
                score,
                playerName,
                playerId,
            }));
    }

    @computed public get userList(): AppUser[] {
        return this.peer?.users ?? [];
    }

    @computed public get user(): AppUser | undefined {
        return this.getUser(this.userId);
    }

    public getUser(userId: string): AppUser | undefined {
        return this.peer?.getUser(userId);
    }

    public getRank(playerId: string): number {
        return this.scoreList.find((entry) => entry.playerId === playerId)?.rank ?? 0;
    }

    public changeName(newName: string): void {
        this.peer?.updateUser({ name: newName });
    }

    public async sendStartGame(): Promise<void> {
        if (!this.messageStartGame) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.START_GAME);
        try {
            await this.messageStartGame.send({ config: this.config }).waitForAll();
        } finally {
            this.loading.delete(LoadingFeatures.START_GAME);
        }
    }

    public sendChangeConfig(): void {
        if (!this.messageChangeConfig) {
            throw new Error("Network not initialized.");
        }
        this.messageChangeConfig.send({ config: this.config });
    }

    public async sendNextRound(): Promise<void> {
        if (!this.messageNextRound) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.NEXT_ROUND);
        try {
            await this.messageNextRound.send({ config: this.config }).waitForAll();
        } finally {
            this.loading.delete(LoadingFeatures.NEXT_ROUND);
        }
    }

    public async sendSkip(): Promise<void> {
        if (!this.messageSkipTurn) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.SKIP);
        try {
            await this.messageSkipTurn
                .send({ skipped: !this.userStates.get(this.userId)?.skipped ?? true })
                .waitForAll();
        } finally {
            this.loading.delete(LoadingFeatures.SKIP);
        }
    }

    public async sendEndRound(): Promise<void> {
        if (!this.messageEndRound) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.END_ROUND);
        try {
            await this.messageEndRound.send({ config: this.config }).waitForAll();
        } finally {
            this.loading.delete(LoadingFeatures.END_ROUND);
        }
    }

    public sendSolution(): void {
        if (!this.messageSolution) {
            throw new Error("Network not initialized.");
        }
        this.messageSolution.send({ solution: Array.from(this.solution?.entries() ?? []) });
    }

    public sendTouchCategory(category: string): void {
        if (!this.messageTouchCategory) {
            throw new Error("Network not initialized.");
        }
        this.messageTouchCategory.send({ category });
    }

    public async sendScoreWord(userId: string, category: string, scoreType: ScoreType): Promise<void> {
        if (!this.messageScoreWord) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.SCORE_WORD);
        try {
            await this.messageScoreWord.send({ userId, category, scoreType }).waitForAll();
        } finally {
            this.loading.delete(LoadingFeatures.SCORE_WORD);
        }
    }

    public async sendAcceptScoring(): Promise<void> {
        if (!this.messageAcceptScoring) {
            throw new Error("Network not initialized.");
        }
        this.loading.add(LoadingFeatures.ACCEPT_SOLUTIONS);
        try {
            await this.messageAcceptScoring.send({}).waitForAll();
        } finally {
            this.loading.delete(LoadingFeatures.ACCEPT_SOLUTIONS);
        }
    }

    public getScore(userId: string, category: string): ScoreType {
        return this.userStates.get(userId)?.currentScores.get(category) ?? ScoreType.NONE;
    }

    @action.bound public changeCategory(index: number, newName: string): void {
        this.config.categories[index] = newName;

        this.sendChangeConfig();
    }

    @action.bound public deleteCategory(index: number): void {
        this.config.categories.splice(index, 1);

        this.sendChangeConfig();
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

    @computed public get allSkipped(): boolean {
        return this.userList.every(({ id }) => this.userStates.get(id)?.skipped);
    }

    @action.bound private generateLetter(): void {
        if (!this.rng) {
            return;
        }
        this.currentLetter = Array.from(this.availableLetters.values())[
            this.rng.intBetween(0, this.availableLetters.size - 1)
        ];
        this.usedLetters.add(this.currentLetter);
    }

    @action.bound private startTurn(): void {
        if (!this.rng) {
            throw new Error("Game not started.");
        }
        for (const { id } of this.userList) {
            const state = this.userStates.get(id);
            if (!state) {
                this.userStates.set(id, {
                    touchedCategories: new Set(),
                    currentScores: new Map(),
                    solutions: new Map(),
                    skipped: false,
                    totalScore: 0,
                    hasAcceptedScore: false,
                });
            } else {
                state.hasAcceptedScore = false;
                state.touchedCategories.clear();
                state.currentScores.clear();
                state.solutions.clear();
                state.skipped = false;
            }
            for (const category of this.config.categories) {
                this.userStates.get(id)!.solutions.set(category, "");
            }
        }
        this.generateLetter();
        if (!this.peer) {
            throw new Error("Network not initialized.");
        }
        this.state = GameState.GUESS;
        this.deadline = Date.now() + 8000;
        setTimeout(() => this.audios.play(audioCountdown), 1000);
        const interval = setInterval(() => {
            this.now = Date.now();
            if (!this.inCountdown) {
                clearInterval(interval);
            }
        }, 200);
    }

    public getWord(userId: string, category: string): string {
        return this.userStates.get(userId)?.solutions.get(category)?.toLowerCase() ?? "";
    }

    public getAllWords(category: string): Map<string, number> {
        const result = new Map<string, number>();
        for (const [_userId, state] of this.userStates) {
            const word = state.solutions.get(category) ?? "";
            const trimmed = word.trim().toLowerCase();
            if (!trimmed || trimmed.length === 0) {
                continue;
            }
            result.set(trimmed, (result.get(trimmed) ?? 0) + 1);
        }
        return result;
    }

    @action.bound private setScore(userId: string, category: string, score: ScoreType): void {
        this.userStates.get(userId)?.currentScores?.set(category, score);
    }

    private precalculateScores(): void {
        for (const category of this.config.categories) {
            const allWords = this.getAllWords(category);
            for (const { id: userId } of this.userList) {
                const word = this.getWord(userId, category);
                if (!word) {
                    this.setScore(userId, category, ScoreType.NONE);
                } else if (allWords.get(word) === 1) {
                    if (allWords.size === 1) {
                        this.setScore(userId, category, ScoreType.ONLY);
                    } else {
                        this.setScore(userId, category, ScoreType.UNIQUE);
                    }
                } else {
                    this.setScore(userId, category, ScoreType.DUPLICATE);
                }
            }
        }
    }

    private hasTouchedCategory(userId: string, category: string): boolean {
        return this.userStates.get(userId)?.touchedCategories.has(category) ?? false;
    }

    public getUntouched(category: string): number {
        let result = 0;
        for (const user of this.userList) {
            if (!this.hasTouchedCategory(user.id, category)) {
                result++;
            }
        }
        return result;
    }

    @action.bound public setWord(userId: string, category: string, word: string): void {
        this.userStates.get(userId)?.solutions.set(category, word);
        if (!this.hasTouchedCategory(userId, category)) {
            this.sendTouchCategory(category);
        }
    }

    @computed public get notAcceptedScoringCount(): number {
        return this.userList.reduce(
            (result, current) => (!this.userStates.get(current.id)!.hasAcceptedScore ? result + 1 : result),
            0,
        );
    }

    @computed public get inCountdown(): boolean {
        return this.now < this.deadline;
    }

    public isUserDone(userId: string): boolean {
        const state = this.userStates.get(userId)!;
        return state.skipped || this.config.categories.every((category) => Boolean(state.solutions.get(category)));
    }

    @action.bound private endRound(): void {
        this.state = GameState.SCORING;
        this.sendSolution();
    }

    @action.bound public async initialize(networkId?: string, userId?: string): Promise<void> {
        const options: PeerOptions<AppUser> = {
            applicationProtocolVersion: `${SOFTWARE_VERSION}`,
            peerJsOptions: {
                host: "peerjs.92k.de",
                secure: true,
            },
            pingInterval: 4,
            timeout: 10,
        };
        const user = {
            name: NomineLipsum.full(),
        };
        this.peer =
            typeof networkId === "string"
                ? await createObservableClient(options, networkId, userId ? userId : user)
                : await createObservableHost(options, user);
        this.messageWelcome = this.peer.message<MessageWelcome>(MessageType.WELCOME);
        this.messageChangeConfig = this.peer.message<MessageChangeConfig>(MessageType.CHANGE_CONFIG);
        this.messageStartGame = this.peer.message<MessageStartGame>(MessageType.START_GAME);
        this.messageNextRound = this.peer.message<MessageNextRound>(MessageType.NEXT_ROUND);
        this.messageEndRound = this.peer.message<MessageEndRound>(MessageType.END_ROUND);
        this.messageSolution = this.peer.message<MessageSolution>(MessageType.SOLUTION);
        this.messageScoreWord = this.peer.message<MessageScoreWord>(MessageType.SCORE_WORD);
        this.messageTouchCategory = this.peer.message<MessageTouchCategory>(MessageType.TOUCH_CATEGORY);
        this.messageSkipTurn = this.peer.message<MessageSkipTurn>(MessageType.SKIP);
        this.messageAcceptScoring = this.peer.message<MessageAcceptScoring>(MessageType.ACCEPT_SCORING);
        this.messageGameState = this.peer.message<MessageGameState>(MessageType.GAME_STATE);

        this.messageSkipTurn.subscribe(({ skipped }, userId) => {
            if (skipped) {
                this.audios.play(audioPass);
            } else {
                this.audios.play(audioUnpass);
            }
            this.userStates.get(userId)!.skipped = skipped;
            if (this.allSkipped) {
                this.endRound();
            }
        });

        this.messageWelcome.subscribe(({ config }) => {
            this.config = config;
        });
        this.messageTouchCategory.subscribe(({ category }, userId) => {
            this.userStates.get(userId)?.touchedCategories.add(category);
            if (userId === this.userId) {
                this.audios.play(audioTickOwn);
            } else {
                this.audios.play(audioTickOtherPlayer);
            }
        });
        this.messageChangeConfig.subscribe(({ config }) => (this.config = config));
        this.messageStartGame.subscribe(({ config }) => {
            this.config = config;
            this.rng = randomSeed(config.seed);
            this.startTurn();
            for (const [_userId, state] of this.userStates) {
                state.totalScore = 0;
            }
        });
        this.messageNextRound.subscribe(() => {
            this.round++;
            this.startTurn();
        });
        this.messageEndRound.subscribe((_, userId) => {
            this.endRound();
            if (userId === this.userId) {
                this.audios.play(audioFinishedFirst);
            } else {
                this.audios.play(audioFinishedOther);
            }
        });
        this.messageSolution.subscribe(({ solution }, userId) => {
            this.userStates.get(userId)!.solutions = new Map(solution);
            if (!this.userList) {
                throw new Error("Network not initialized.");
            }
            this.precalculateScores();
        });
        this.messageScoreWord.subscribe(({ userId, category, scoreType }) => {
            this.userStates.get(userId)?.currentScores.set(category, scoreType);
            this.audios.play(audioAcceptReset);
            for (const state of this.userStates.values()) {
                state.hasAcceptedScore = false;
            }
        });
        this.messageAcceptScoring.subscribe((_, userId) => {
            this.userStates.get(userId)!.hasAcceptedScore = true;
            const haveNotAccepted = this.userList.filter(({ id }) => !this.userStates.get(id)?.hasAcceptedScore);
            if (haveNotAccepted.length === 1 && haveNotAccepted[0].id === this.userId) {
                this.audios.play(audioAcceptWaiting);
            } else {
                if (userId === this.userId) {
                    this.audios.play(audioAcceptSelf);
                } else {
                    this.audios.play(audioAcceptOther);
                }
            }
            if (haveNotAccepted.length !== 0) {
                return;
            }
            for (const [_userId, state] of this.userStates) {
                const sum = Array.from(state.currentScores.values()).reduce((result, current) => result + current, 0);
                state.totalScore = (state.totalScore ?? 0) + sum;
            }
            this.state = GameState.SCORES;
        });
        this.messageGameState?.subscribe(
            action(({ config, state, deadline, round, userStates, currentLetter, usedLetters }) => {
                this.config = config;
                this.deadline = deadline;
                this.round = round;
                this.userStates = new Map(userStates.map(deserializeUserState));
                this.rng = randomSeed(this.config.seed);
                while (this.currentLetter !== currentLetter) {
                    this.generateLetter();
                }
                if (
                    usedLetters.length !== this.usedLetters.size ||
                    !usedLetters.every((letter) => this.usedLetters.has(letter))
                ) {
                    throw new Error("Inconsistent random seed. Wrong sequence of letters generated.");
                }
                this.state = state;
            }),
        );

        this.peer.on("userreconnect", (user) => {
            if (!this.peer?.isHost) {
                return;
            }
            this.messageGameState?.send(
                {
                    config: this.config,
                    state: this.state,
                    deadline: this.deadline,
                    round: this.round,
                    userStates: Array.from(this.userStates.entries()).map(([userId, userState]) =>
                        serializeUserState(userId, userState),
                    ),
                    currentLetter: this.currentLetter,
                    usedLetters: Array.from(this.usedLetters.values()),
                },
                user.id,
            );
        });
    }
}
