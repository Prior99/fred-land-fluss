import * as React from "react";
import { external, inject } from "tsdi";
import { observer } from "mobx-react";
import { GameState } from "../../types";
import "./game-container.scss";
import { Game } from "../../game";
import { Lobby } from "../../ui";
import { Button, Segment, Popup } from "semantic-ui-react";
import { Scoreboard } from "../scoreboard/scoreboard";
import { Status } from "../status";

export interface GameContainerProps {
    className?: string;
}

@external
@observer
export class GameContainer extends React.Component<GameContainerProps> {
    @inject private game!: Game;

    public render(): JSX.Element {
        switch (this.game.state) {
            case GameState.LOBBY:
                return <Lobby className="GameContainer__lobby" />;
            case GameState.GUESS:
                return (
                        <div className="GameContainer">
                            <div className="GameContainer__container">
                                <div className="GameContainer__mainArea">
                                    <Segment className="GameContainer__boardContainer">
                                    </Segment>

                                </div>
                                <div className="GameContainer__sidebar">
                                    <div className="GameContainer__statusContainer">
                                        <Segment className="GameContainer__sidebarSegment">
                                            <Status className="GameContainer__status" />
                                        </Segment>
                                    </div>
                                    <div className="GameContainer__scoreboardContainer">
                                        <Segment className="GameContainer__sidebarSegment">
                                            <Scoreboard className="GameContainer__scoreboard" />
                                        </Segment>
                                    </div>
                                    <div className="GameContainer__actions">
                                        <Segment className="GameContainer__sidebarSegment">
                                            <Popup
                                                header="Cannot end turn"
                                                content={"Lol"}
                                                disabled={false}
                                                inverted
                                                trigger={
                                                    <span>
                                                        <Button
                                                            fluid
                                                            loading={false}
                                                            disabled={false}
                                                            icon="thumbs up"
                                                            labelPosition="left"
                                                            size="big"
                                                            content="End turn"
                                                            primary
                                                            className="GameContainer__commitButton"
                                                        />
                                                    </span>
                                                }
                                            />
                                        </Segment>
                                    </div>
                                </div>
                            </div>
                        </div>
                );
            default:
                return(<div>Lol</div>)
        }
    }
}
