import * as React from "react";
import { computed } from "mobx";
import "./background.scss";
import classNames from "classnames";

export interface BackgroundProps {
    className?: string;
    floating?: boolean;
}

const size = 20;
const data: number[] = [];
for (let x = 0; x < size * size; ++x) {
    data.push(Math.random());
}

export class Background extends React.Component<BackgroundProps> {
    @computed private get classNames(): string {
        return classNames("Background", this.props.className, { "Background--floating": this.props.floating });
    }

    public render(): JSX.Element {
        const grids: JSX.Element[] = [];
        for (let grid = 0; grid < 4; ++grid) {
            grids.push(
                <div key={grid} className="Background__cells">
                    {data.map(() => (
                        <div>Lol</div>
                    ))}
                </div>,
            );
        }

        return (
            <div className={this.classNames}>
                <div className="Background__floater">{grids}</div>
            </div>
        );
    }
}
