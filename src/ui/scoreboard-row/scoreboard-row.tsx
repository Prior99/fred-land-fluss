import * as React from "react";
import { external, inject } from "tsdi";
import { observer } from "mobx-react";
import { Game } from "../../game";
import { Table, Label } from "semantic-ui-react";
import { computed } from "mobx";
import "./scoreboard-row.scss";

export interface ScoreboardRowProps {
    userId: string;
}

@external
@observer
export class ScoreboardRow extends React.Component<ScoreboardRowProps> {
    @inject private game!: Game;

    @computed private get playerName(): string {
        return this.game.getUser(this.props.userId)?.name ?? "";
    }

    @computed private get score(): string {
        return (this.game.userStates.get(this.props.userId)?.totalScore ?? 0).toLocaleString();
    }

    @computed private get rank(): string {
        return (this.game.getRank(this.props.userId) ?? 0).toLocaleString();
    }

    @computed private get showRibbon(): boolean {
        return this.game.userId === this.props.userId;
    }

    public render(): JSX.Element {
        return (
            <Table.Row>
                <Table.Cell className="ScoreboardRow__rank">
                    {this.showRibbon ? (
                        <Label ribbon className="ScoreboardRow__label" color="blue">
                            {this.rank}
                        </Label>
                    ) : (
                        this.rank
                    )}
                </Table.Cell>
                <Table.Cell>{this.playerName}</Table.Cell>
                <Table.Cell textAlign="right" className="ScoreboardRow__score">
                    {this.score}
                </Table.Cell>
            </Table.Row>
        );
    }
}
