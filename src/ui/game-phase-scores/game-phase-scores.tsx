import * as React from "react";
import { observer } from "mobx-react";
import { external, inject } from "tsdi";
import { Game } from "../../game";
import "./game-phase-scores.scss";

@external
@observer
export class GamePhaseScores extends React.Component {
    @inject private game!: Game;

    public render(): JSX.Element {
        return (
            <div className="GamePhaseScores">
            </div>
        )
    }
}