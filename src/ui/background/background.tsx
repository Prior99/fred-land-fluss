import * as React from "react";
import { create as randomSeed } from "random-seed";
import { computed } from "mobx";
import "./background.scss";
import classNames from "classnames";
import { allLetters } from "../../utils";
import { Letter } from "../../types";

export interface BackgroundProps {
    className?: string;
    animated?: boolean;
}

const rng = randomSeed(`${Math.random()}`);
const letters = Array.from(allLetters.values());

function getLetter(): { fontSize: number; letter: Letter; x: number; y: number; opacity: number } {
    return {
        fontSize: rng.floatBetween(10, 30),
        letter: letters[rng.intBetween(0, letters.length - 1)],
        x: rng.floatBetween(0, 100),
        y: rng.floatBetween(0, 100),
        opacity: rng.floatBetween(0.4, 0.8),
    };
}

export class Background extends React.Component<BackgroundProps> {
    @computed private get classNames(): string {
        return classNames("Background", this.props.className);
    }

    public render(): JSX.Element {
        const elements: JSX.Element[] = [];
        for (let i = 0; i < 800; ++i) {
            const { fontSize, x, y, letter, opacity } = getLetter();
            const xToCenter = 50 - x;
            const yToCenter = 50 - y;
            const rotation = Math.atan2(xToCenter, yToCenter);
            elements.push(
                <div
                    key={i}
                    className="Background__letter"
                    style={{ opacity, fontSize, top: `${y}vh`, left: `${x}vw`, transform: `rotate(${-rotation}rad)` }}
                >
                    {letter.toUpperCase()}
                </div>,
            );
        }
        return (
            <div className={this.classNames}>
                <div className="Background__content">{elements}</div>
                <div className="Background__blur"></div>
            </div>
        );
    }
}
