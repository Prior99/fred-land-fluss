import * as React from "react";
import { external, inject } from "tsdi";
import { Segment, Form, Input, Grid, Button } from "semantic-ui-react";
import { computed, action, observable } from "mobx";
import { observer } from "mobx-react";
import { MenuContainer } from "..";
import { Game, LoadingFeatures } from "../../game";
import "./game-phase-lobby.scss";
import { NetworkMode } from "p2p-networking";
import { IdMessage, UserTable } from "p2p-networking-semantic-ui-react";

export interface GamePhaseLobbyProps {
    className?: string;
}

@external
@observer
export class GamePhaseLobby extends React.Component<GamePhaseLobbyProps> {
    @inject private game!: Game;

    @observable private focus = false;
    @observable private inputName: string | undefined;

    @action.bound private handleStartClick(): void {
        this.game.sendStartGame();
    }

    @computed private get name(): string {
        return this.inputName ?? this.game.user?.name ?? "";
    }

    @computed private get isHost(): boolean {
        return this.game.peer?.networkMode === NetworkMode.HOST;
    }

    @computed private get nameValid(): boolean {
        return this.game.userName.length > 0 && this.game.userName.length < 24;
    }

    @action.bound private handleNameChange(evt: React.SyntheticEvent<HTMLInputElement>): void {
        this.inputName = evt.currentTarget.value;
        this.game.changeName(this.inputName);
    }

    @action.bound private handleCategoryChange(value: string, index: number): void {
        this.focus = false;
        this.game.changeCategory(index, value);
    }

    @action.bound private handleUnfocus(): void {
        this.focus = false;
    }

    @action.bound private handleCategoryDelete(index: number): void {
        this.game.deleteCategory(index);
    }

    @action.bound private handleCategoryAdd(value: string): void {
        this.focus = true;
        this.game.changeCategory(this.game.config.categories.length, value);
    }

    @computed private get loading(): boolean {
        return this.game.loading.has(LoadingFeatures.START_GAME);
    }

    public render(): JSX.Element {
        return (
            <MenuContainer className={this.props.className}>
                <Grid className="Lobby__grid">
                    <Grid.Row>
                        <Grid.Column>
                            <Segment>
                                {this.game.peer && (
                                    <UserTable
                                        nameFactory={(user) => user.name}
                                        basic="very"
                                        unstackable
                                        peer={this.game.peer}
                                    />
                                )}
                                <Form>
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column>
                                                <Form.Field error={!this.nameValid}>
                                                    <label>Change name</label>
                                                    <Input
                                                        value={this.name}
                                                        onChange={this.handleNameChange}
                                                    />
                                                </Form.Field>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            {this.game.config.categories.map((category, index) => (
                                                <Grid.Column key={index} computer="8" mobile="16">
                                                    {this.isHost ? (
                                                        <Form.Group inline>
                                                            <Form.Field error={category.length === 0}>
                                                                <label>Category {index + 1}</label>
                                                                <Input
                                                                    ref={(input) =>
                                                                        this.focus &&
                                                                        index ===
                                                                            this.game.config.categories.length - 1 &&
                                                                        input &&
                                                                        input.focus()
                                                                    }
                                                                    value={category}
                                                                    onChange={(evt) =>
                                                                        this.handleCategoryChange(
                                                                            evt.currentTarget.value,
                                                                            index,
                                                                        )
                                                                    }
                                                                />
                                                            </Form.Field>
                                                            <Form.Field>
                                                                <label>Delete</label>
                                                                <Button
                                                                    icon="trash"
                                                                    disabled={!this.isHost}
                                                                    onClick={() => this.handleCategoryDelete(index)}
                                                                />
                                                            </Form.Field>
                                                        </Form.Group>
                                                    ) : (
                                                        <Segment key={index} style={{ marginBottom: 10 }}>
                                                            <Form.Field error={category.length === 0}>
                                                                <label>Category {index + 1}</label>
                                                                <p>{category}</p>
                                                            </Form.Field>
                                                        </Segment>
                                                    )}
                                                </Grid.Column>
                                            ))}
                                            {this.isHost && (
                                                <Grid.Column
                                                    key={this.game.config.categories.length}
                                                    computer="8"
                                                    mobile="16"
                                                >
                                                    <Form.Group inline>
                                                        <Form.Field>
                                                            <label>
                                                                Category {this.game.config.categories.length + 1}
                                                            </label>
                                                            <Input
                                                                value=""
                                                                onChange={(evt) =>
                                                                    this.handleCategoryAdd(evt.currentTarget.value)
                                                                }
                                                            />
                                                        </Form.Field>
                                                        <Form.Field>
                                                            <label>Delete</label>
                                                            <Button icon="trash" disabled />
                                                        </Form.Field>
                                                    </Form.Group>
                                                </Grid.Column>
                                            )}
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column>
                                                {this.isHost ? (
                                                    <Form.Field>
                                                        <Form.Button
                                                            icon="play circle"
                                                            labelPosition="left"
                                                            primary
                                                            fluid
                                                            className="Lobby__startButton"
                                                            onClick={this.handleStartClick}
                                                            content="Start"
                                                            disabled={this.loading}
                                                            loading={this.loading}
                                                        />
                                                    </Form.Field>
                                                ) : (
                                                    <p>
                                                        Please wait <b>patiently</b> for the host to start the game...
                                                    </p>
                                                )}
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                </Form>
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <IdMessage
                                peer={this.game.peer}
                                urlFactory={(id) => location.href.replace(location.hash, `#/game/client/${id}`)}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </MenuContainer>
        );
    }
}
