import * as React from "react";
import { addRoute, RouteProps } from "../../routing";
import { external, inject } from "tsdi";
import { observer } from "mobx-react";
import { LobbyMode, GameState } from "../../types";
import "./page-game.scss";
import { Game } from "../../game";
import { Lobby, GameContainer } from "../../ui";

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

    public render(): JSX.Element {
        switch (this.game.state) {
            case GameState.LOBBY:
                return <Lobby className="PageGame__lobby" />;
            case GameState.GUESS:
                return <GameContainer className="PageGame__gameContainer" />;
            default:
                return <div>Lol</div>
        }
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
