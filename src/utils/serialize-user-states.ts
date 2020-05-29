import { UserState } from "../game";
import { ScoreType } from "../types";

export interface SerializedUserState {
    solutions: [string, string][];
    currentScores: [string, ScoreType][];
    touchedCategories: string[];
    totalScore: number;
    skipped: boolean;
    hasAcceptedScore: boolean;
    userId: string;
}

export function deserializeUserState({
    solutions,
    currentScores,
    touchedCategories,
    totalScore,
    skipped,
    hasAcceptedScore,
    userId,
}: SerializedUserState): [string, UserState] {
    return [
        userId,
        {
            solutions: new Map(solutions),
            currentScores: new Map(currentScores),
            touchedCategories: new Set(touchedCategories),
            totalScore,
            skipped,
            hasAcceptedScore,
        },
    ];
}

export function serializeUserState(
    userId: string,
    { solutions, currentScores, touchedCategories, totalScore, skipped, hasAcceptedScore }: UserState,
): SerializedUserState {
    return {
        solutions: Array.from(solutions.entries()),
        currentScores: Array.from(currentScores.entries()),
        touchedCategories: Array.from(touchedCategories.values()),
        totalScore,
        skipped,
        hasAcceptedScore,
        userId,
    };
}
