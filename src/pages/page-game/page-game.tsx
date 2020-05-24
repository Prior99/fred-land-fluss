import * as React from "react";
import { addRoute, RouteProps } from "../../routing";
import { external, inject } from "tsdi";
import { observer } from "mobx-react";
import { LobbyMode, GameState } from "../../types";
import "./page-game.scss";
import { Game } from "../../game";
import { computed } from "mobx";
import { GamePhaseCountdown, GamePhaseGuess, GamePhaseLobby, GamePhaseScoring } from "../../ui";
import { GamePhaseScores } from "../../ui/game-phase-scores/game-phase-scores";
import { unreachable } from "../../utils";

export interface PageGameProps {
    lobbyMode: LobbyMode;
    id?: string;
}

@external
@observer
export class PageGame extends React.Component<RouteProps<PageGameProps>> {
    @inject private game!: Game;

    async componentDidMount(): Promise<void> {
        if (this.props.match.params.lobbyMode === LobbyMode.HOST) {
            await this.game.initialize();
        } else {
            await this.game.initialize(this.props.match.params.id!);
        }
    }

    @computed public get component(): JSX.Element {
        switch (this.game.state) {
            case GameState.GUESS:
                if (this.game.inCountdown) {
                    return <GamePhaseCountdown />;
                } else {
                    return <GamePhaseGuess />;
                }
            case GameState.LOBBY:
                return <GamePhaseLobby />;
            case GameState.SCORES:
                return <GamePhaseScores />;
            case GameState.SCORING:
                return <GamePhaseScoring />;
            default:
                unreachable(this.game.state);
        }
    }

    public render(): JSX.Element {
        return (
            <div className="PageGame">
                {this.component}
            </div>
        );
    }
}

export const routeGame = addRoute<PageGameProps>({
    path: (lobbyMode: LobbyMode, id?: string) => {
        switch (lobbyMode) {
            case LobbyMode.CLIENT:
                return `/game/client/${id}`;
            case LobbyMode.HOST:
                return `/game/host`;
        }
    },
    pattern: "/game/:lobbyMode/:id?",
    component: PageGame,
});
