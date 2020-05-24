import * as React from "react";
import { observer } from "mobx-react";
import { external, inject } from "tsdi";
import { Game } from "../../game";
import "./game-phase-countdown.scss";

@external
@observer
export class GamePhaseCountdown extends React.Component {
    @inject private game!: Game;

    public render(): JSX.Element {
        return (
            <div className="GamePhaseCountdown">
                <div className="GamePhaseCountdown__container">
                    <div className="GamePhaseCountdown__character GamePhaseCountdown__character--1"></div>
                    <div className="GamePhaseCountdown__character GamePhaseCountdown__character--2"></div>
                    <div className="GamePhaseCountdown__character GamePhaseCountdown__character--3"></div>
                    <div className="GamePhaseCountdown__character GamePhaseCountdown__character--letter">
                        {this.game.currentLetter.toUpperCase()}
                    </div>
                </div>
            </div>
        );
    }
}
