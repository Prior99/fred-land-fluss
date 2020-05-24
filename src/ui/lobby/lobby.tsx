import * as React from "react";
import { external, inject } from "tsdi";
import {
    Segment,
    Form,
    Input,
    Popup,
    Message,
    Grid,
    List,
} from "semantic-ui-react";
import { computed, action } from "mobx";
import { observer } from "mobx-react";
import { MenuContainer } from "../../ui";
import { Game } from "../../game";
import "./lobby.scss";
import { NetworkMode } from "p2p-networking";
import { AppUser } from "../../types";

export interface LobbyProps {
    className?: string;
}

@external
@observer
export class Lobby extends React.Component<LobbyProps> {
    @inject private game!: Game;

    @action.bound private handleStartClick(): void {
        this.game.sendStartGame();
    }

    @computed private get isHost(): boolean {
        return this.game.networkMode === NetworkMode.HOST;
    }

    @action.bound private async handleIdClick(): Promise<void> {
        if (this.hasClipboardApi) {
            await navigator.clipboard.writeText(this.connectUrl);
        }
    }

    @computed private get hasClipboardApi(): boolean {
        return Boolean(navigator.clipboard);
    }

    @computed private get connectUrl(): string {
        return location.href.replace(location.hash, `#/game/client/${this.game.peer?.hostConnectionId}`);
    }

    @computed private get popupText(): string {
        if (this.hasClipboardApi) {
            return "Copied to clipboard.";
        }
        return `Can't copy to clipboard: "${this.connectUrl}".`;
    }

    @computed private get ownUser(): AppUser | undefined {
        return this.game.user;
    }

    @computed private get nameValid(): boolean {
        return this.game.userName.length > 0 && this.game.userName.length < 24;
    }

    @action.bound private handleNameChange(evt: React.SyntheticEvent<HTMLInputElement>): void {
        const name = evt.currentTarget.value;
        alert("Lol");
    }

    public render(): JSX.Element {
        return (
            <MenuContainer className={this.props.className}>
                <Grid className="Lobby__grid">
                    <Grid.Row>
                        <Grid.Column>
                            <Segment>
                                <h2>Players</h2>
                                <List as="ul">
                                    {(this.game.users ?? []).map(({ id, name }) => (
                                        <List.Item as="li" key={id} content={name} />
                                    ))}
                                </List>
                                <h2>Options</h2>
                                <Form>
                                    <Form.Field error={!this.nameValid}>
                                        <label>Change name</label>
                                        <Input value={this.game.userName} onChange={this.handleNameChange} />
                                    </Form.Field>
                                    {this.isHost ? (
                                        <>
                                            <Form.Button
                                                icon="play circle"
                                                labelPosition="left"
                                                primary
                                                fluid
                                                className="Lobby__startButton"
                                                onClick={this.handleStartClick}
                                                content="Start"
                                            />
                                        </>
                                    ) : (
                                        <p>
                                            Please wait <b>patiently</b> for the host to start the game...
                                        </p>
                                    )}
                                </Form>
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <Popup
                                on="click"
                                inverted
                                trigger={
                                    <Message
                                        icon="globe"
                                        onClick={this.handleIdClick}
                                        content={this.game.peer?.hostConnectionId}
                                        className="Lobby__idMessage"
                                    />
                                }
                                content={this.popupText}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </MenuContainer>
        );
    }
}
