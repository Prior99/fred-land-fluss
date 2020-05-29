import * as React from "react";
import { observer } from "mobx-react";
import { external, inject } from "tsdi";
import { Game, LoadingFeatures } from "../../game";
import "./game-phase-guess.scss";
import { CategoryBox } from "../category-box";
import { Button, Card, Form } from "semantic-ui-react";
import { action, computed } from "mobx";

@external
@observer
export class GamePhaseGuess extends React.Component {
    @inject private game!: Game;

    @action.bound private handleSkip(evt: React.SyntheticEvent<HTMLButtonElement>): void {
        evt.preventDefault();
        this.game.sendSkip();
    }

    @action.bound private handleSubmit(evt: React.SyntheticEvent<HTMLFormElement>): void {
        evt.preventDefault();
        this.game.sendEndRound();
    }

    @computed private get gaveUp(): boolean {
        return this.game.userStates.get(this.game.userId!)?.skipped ?? false;
    }

    @computed private get submitLoading(): boolean {
        return this.game.loading.has(LoadingFeatures.END_ROUND);
    }

    @computed private get skipLoading(): boolean {
        return this.game.loading.has(LoadingFeatures.SKIP);
    }

    public render(): JSX.Element {
        return (
            <div className="GamePhaseGuess">
                <Form onSubmit={this.handleSubmit} className="GamePhaseGuess__form">
                    <div className="GamePhaseGuess__content">
                        {this.game.config.categories.map((category, index) => (
                            <CategoryBox
                                first={index === 0}
                                category={category}
                                key={index}
                                className="GamePhaseGuess__categoryBox"
                            />
                        ))}
                    </div>
                    <Card className="GamePhaseGuess__buttonCard">
                        <Button.Group>
                            <Button
                                className="GamePhaseGuess__button"
                                disabled={this.skipLoading}
                                content={this.gaveUp ? "Undo" : "Give up"}
                                icon={this.gaveUp ? "redo" : "pause"}
                                loading={this.skipLoading}
                                onClick={this.handleSkip}
                                type="button"
                                primary={this.gaveUp}
                            />
                            <Button.Or />
                            <Button
                                className="GamePhaseGuess__button"
                                disabled={this.submitLoading || !this.game.canEndTurn}
                                content="Done"
                                icon="check"
                                type="submit"
                                loading={this.submitLoading}
                                primary={this.game.canEndTurn}
                            />
                        </Button.Group>
                    </Card>
                </Form>
            </div>
        );
    }
}
