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
            </div>
        )
    }
}