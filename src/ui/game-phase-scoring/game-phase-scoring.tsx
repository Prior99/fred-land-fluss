import * as React from "react";
import { observer } from "mobx-react";
import { external, inject } from "tsdi";
import { Game } from "../../game";
import "./game-phase-scoring.scss";

@external
@observer
export class GamePhaseScoring extends React.Component {
    @inject private game!: Game;

    public render(): JSX.Element {
        return (
            <div className="GamePhaseScoring">
            </div>
        )
    }
}