import * as React from "react";
import { Table } from "semantic-ui-react";
import { inject, external } from "tsdi";
import { Game } from "../../game";
import { observer } from "mobx-react";
import classNames from "classnames";
import { computed } from "mobx";

export interface StatusProps {
    className?: string;
}

@external
@observer
export class Status extends React.Component<StatusProps> {
    @inject private game!: Game;

    @computed private get classNames(): string {
        return classNames("Status", this.props.className);
    }

    public render(): JSX.Element {
        return (
            <Table basic="very" className={this.classNames}>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell>Turn</Table.Cell>
                        <Table.Cell>{this.game.turn + 1}</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
    }
}