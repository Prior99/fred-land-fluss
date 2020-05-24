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

    @action.bound private handleSubmit(evt: React.SyntheticEvent<HTMLFormElement>): void {
        evt.preventDefault();
        this.game.sendEndRound();
    }

    @computed private get loading(): boolean {
        return this.game.loading.has(LoadingFeatures.END_ROUND);
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
                        <Button
                            className="GamePhaseGuess__button"
                            primary
                            disabled={this.loading || !this.game.canEndTurn}
                            content="Submit"
                            icon="check"
                            loading={this.loading}
                        />
                    </Card>
                </Form>
            </div>
        );
    }
}
