import * as React from "react";
import { observer } from "mobx-react";
import { external, inject } from "tsdi";
import { Game, LoadingFeatures } from "../../game";
import "./game-phase-scoring.scss";
import { CategoryBox } from "../category-box";
import { Card, Form, Button } from "semantic-ui-react";
import { NetworkMode } from "p2p-networking";
import { computed, action } from "mobx";

@external
@observer
export class GamePhaseScoring extends React.Component {
    @inject private game!: Game;

    @computed private get loading(): boolean {
        return this.game.loading.has(LoadingFeatures.ACCEPT_SOLUTIONS);
    }

    @action.bound private handleSubmit(evt: React.SyntheticEvent<HTMLFormElement>): void {
        this.game.sendAcceptSolutions();
    }

    public render(): JSX.Element {
        return (
            <div className="GamePhaseScoring">
                <Form onSubmit={this.handleSubmit} className="GamePhaseScoring__form">
                    <div className="GamePhaseScoring__content">
                        {this.game.config.categories.map((category, index) => (
                            <CategoryBox
                                first={index === 0}
                                category={category}
                                key={index}
                                className="GamePhaseScoring__categoryBox"
                            />
                        ))}
                    </div>
                    {this.game.networkMode === NetworkMode.HOST && (
                        <Card className="GamePhaseScoring__buttonCard">
                            <Button
                                className="GamePhaseScoring__button"
                                primary
                                disabled={this.loading}
                                content="Submit"
                                icon="check"
                                loading={this.loading}
                            />
                        </Card>
                    )}
                </Form>
            </div>
        );
    }
}
