import * as React from "react";
import { Route, addRoute, RouteProps } from "../../routing";
import { external, inject } from "tsdi";
import { Segment, Form, Tab, Input, TabProps } from "semantic-ui-react";
import { Link } from "react-router-dom";
import { observable, computed, action } from "mobx";
import { observer } from "mobx-react";
import { LobbyMode, AppUser } from "../../types";
import { routeGame } from "../page-game";
import "./page-main-menu.scss";
import { MenuContainer } from "../../ui";
import { Game } from "../../game";

declare const SOFTWARE_VERSION: string;

@external
@observer
export class PageMainMenu extends React.Component<RouteProps<{}>> {
    @inject private game!: Game;

    @observable private otherId = "";
    @observable private activeTab = 0;

    @action.bound private handleNameChange(evt: React.SyntheticEvent<HTMLInputElement>): void {
        alert("Lol");
    }

    @action.bound private handleOtherIdChange(evt: React.SyntheticEvent<HTMLInputElement>): void {
        this.otherId = evt.currentTarget.value;
    }

    @action.bound private handleTabChange(_: unknown, { activeIndex }: TabProps): void {
        this.activeTab = activeIndex as number;
    }

    @computed private get nameValid(): boolean {
        return this.game.userName.length > 0 && this.game.userName.length < 24;
    }

    @computed private get panes(): { menuItem: string }[] {
        return [{ menuItem: "Join" }, { menuItem: "Host" }];
    }

    public render(): JSX.Element {
        return (
            <MenuContainer className="PageMainMenu">
                <div className="PageMainMenu__header">
                    <div className="PageMainMenu__logo" />
                    <h1 className="PageMainMenu__name">Fred, Land, Fluss</h1>
                </div>
                <Segment className="PageMainMenu__segment">
                    <Form>
                        <Form.Field error={!this.nameValid}>
                            <label>Change name</label>
                            <Input value={this.game.userName} onChange={this.handleNameChange} />
                        </Form.Field>
                        <Tab
                            className="PageMainMenu__tab"
                            panes={this.panes}
                            activeIndex={this.activeTab}
                            onTabChange={this.handleTabChange}
                        />
                        {this.activeTab === 0 && (
                            <>
                                <Form.Field>
                                    <label>Join</label>
                                    <Input value={this.otherId} onChange={this.handleOtherIdChange} />
                                </Form.Field>
                                <Link to={routeGame.path(LobbyMode.CLIENT, this.otherId)}>
                                    <Form.Button
                                        icon="sign-in"
                                        labelPosition="left"
                                        className="PageMainMenu__button"
                                        disabled={!this.nameValid}
                                        primary
                                        fluid
                                        content="Join"
                                    />
                                </Link>
                            </>
                        )}
                        {this.activeTab === 1 && (
                            <Link to={routeGame.path(LobbyMode.HOST)}>
                                <Form.Button
                                    icon="chess king"
                                    labelPosition="left"
                                    primary
                                    className="PageMainMenu__button"
                                    disabled={!this.nameValid}
                                    fluid
                                    content="Host"
                                />
                            </Link>
                        )}
                    </Form>
                </Segment>
                <div className="PageMainMenu__version">{`Version #${SOFTWARE_VERSION}`}</div>
            </MenuContainer>
        );
    }
}

export const routeMainMenu: Route<{}> = addRoute({
    path: () => "/main-menu",
    pattern: "/main-menu",
    component: PageMainMenu,
});
