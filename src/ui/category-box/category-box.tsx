import * as React from "react";
import classnames from "classnames";
import { observer } from "mobx-react";
import { external, inject } from "tsdi";
import { Game } from "../../game";
import { computed, action } from "mobx";
import { Card, Input } from "semantic-ui-react";
import "./category-box.scss";
import { GameState } from "../../types";
import { SolutionScorer } from "../solution-scorer";

export interface CategoryBoxProps {
    category: string;
    className?: string;
    first: boolean;
}

@external
@observer
export class CategoryBox extends React.Component<CategoryBoxProps> {
    @inject private game!: Game;

    @computed private get category(): string {
        return this.props.category;
    }

    @computed private get word(): string {
        return this.game.getWord(this.game.userId, this.category);
    }

    @action.bound private handleChangeWord(evt: React.SyntheticEvent<HTMLInputElement>): void {
        this.game.setWord(this.game.userId, this.category, evt.currentTarget.value);
    }

    @computed private get classNames(): string {
        return classnames("CategoryBox", this.props.className);
    }

    @computed private get untouched(): number {
        return this.game.getUntouched(this.props.category);
    }

    @computed private get content(): JSX.Element {
        switch (this.game.state) {
            case GameState.GUESS:
                return (
                    <Input
                        placeholder={this.game.currentLetter.toUpperCase()}
                        ref={(input) => this.props.first && input && input.focus()}
                        className="CategoryBox__input"
                        value={this.word}
                        onChange={this.handleChangeWord}
                        fluid
                    />
                );
            case GameState.SCORING:
                return <SolutionScorer category={this.category} />;
            default:
                return <></>;
        }
    }

    public render(): JSX.Element {
        const dots: JSX.Element[] = [];
        for (let i = 0; i < this.game.users.size - this.untouched; ++i) {
            dots.push(<div className="CategoryBox__dot CategoryBox__dot--touched" key={i} />);
        }
        for (let i = 0; i < this.untouched; ++i) {
            dots.push(<div className="CategoryBox__dot" key={i} />);
        }
        return (
            <Card className={this.classNames}>
                <div className="CategoryBox__untouched">{dots}</div>
                <Card.Content header={this.props.category} />
                <Card.Content>{this.content}</Card.Content>
            </Card>
        );
    }
}
