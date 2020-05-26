import * as React from "react";
import classnames from "classnames";
import { observer } from "mobx-react";
import { external, inject } from "tsdi";
import { Game } from "../../game";
import { computed, action } from "mobx";
import { Table, Dropdown } from "semantic-ui-react";
import "./word-scorer.scss";
import { ScoreType } from "../../types";

export interface WordScorerProps {
    category: string;
    userId: string;
    className?: string;
}

@external
@observer
export class WordScorer extends React.Component<WordScorerProps> {
    @inject private game!: Game;

    @computed private get category(): string {
        return this.props.category;
    }

    @computed private get word(): string {
        return this.game.getWord(this.props.userId, this.category);
    }

    @computed private get score(): ScoreType {
        return this.game.getScore(this.props.userId, this.props.category);
    }

    @action.bound private handleChangeScoring(value: ScoreType): void {
        this.game.sendScoreWord(this.props.userId, this.props.category, value);
    }

    @computed private get classNames(): string {
        return classnames("WordScorer", this.props.className);
    }

    @computed private get userName(): string {
        return this.game.getUser(this.props.userId)?.name ?? "";
    }

    public render(): JSX.Element {
        return (
            <Table.Row className={this.classNames}>
                <Table.Cell>{this.userName}</Table.Cell>
                <Table.Cell className="WordScorer__word">{this.word}</Table.Cell>
                <Table.Cell>
                    <Dropdown text={`${this.score}`}>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => this.handleChangeScoring(ScoreType.NONE)} content="0" />
                            <Dropdown.Item onClick={() => this.handleChangeScoring(ScoreType.DUPLICATE)} content="5" />
                            <Dropdown.Item onClick={() => this.handleChangeScoring(ScoreType.UNIQUE)} content="10" />
                            <Dropdown.Item onClick={() => this.handleChangeScoring(ScoreType.ONLY)} content="20" />
                        </Dropdown.Menu>
                    </Dropdown>
                </Table.Cell>
            </Table.Row>
        );
    }
}
