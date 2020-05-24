import * as React from "react";
import classnames from "classnames";
import { observer } from "mobx-react";
import { external, inject } from "tsdi";
import { Game } from "../../game";
import { computed } from "mobx";
import { Table } from "semantic-ui-react";
import "./solution-scorer.scss";
import { WordScorer } from "../word-scorer";

export interface SolutionScorerProps {
    category: string;
    className?: string;
}

@external
@observer
export class SolutionScorer extends React.Component<SolutionScorerProps> {
    @inject private game!: Game;

    @computed private get classNames(): string {
        return classnames("SolutionScorer", this.props.className);
    }

    public render(): JSX.Element {
        return (
            <Table basic="very" className={this.classNames}>
                <Table.Body>
                    {this.game.userList
                        .sort((a, b) => a.id.localeCompare(b.id))
                        .map((user) => (
                            <WordScorer category={this.props.category} userId={user.id} key={user.id} />
                        ))}
                </Table.Body>
            </Table>
        );
    }
}
