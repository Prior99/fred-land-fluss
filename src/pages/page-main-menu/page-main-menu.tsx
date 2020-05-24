import * as React from "react";
import { Route, addRoute, RouteProps } from "../../routing";
import { Segment, Form, Tab, Input, TabProps } from "semantic-ui-react";
import { Link } from "react-router-dom";
import { observable, computed, action } from "mobx";
import { observer } from "mobx-react";
import { LobbyMode } from "../../types";
import { routeGame } from "../page-game";
import "./page-main-menu.scss";
import { MenuContainer } from "../../ui";

declare const SOFTWARE_VERSION: string;

@observer
export class PageMainMenu extends React.Component<RouteProps<{}>> {
    @observable private otherId = "";
    @observable private activeTab = 0;

    @action.bound private handleOtherIdChange(evt: React.SyntheticEvent<HTMLInputElement>): void {
        this.otherId = evt.currentTarget.value;
    }

    @action.bound private handleTabChange(_: unknown, { activeIndex }: TabProps): void {
        this.activeTab = activeIndex as number;
    }

    @computed private get panes(): { menuItem: string }[] {
        return [{ menuItem: "Host" }, { menuItem: "Join" }];
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
                        <Tab
                            className="PageMainMenu__tab"
                            panes={this.panes}
                            activeIndex={this.activeTab}
                            onTabChange={this.handleTabChange}
                        />
                        {this.activeTab === 1 && (
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
                                        primary
                                        fluid
                                        content="Join"
                                    />
                                </Link>
                            </>
                        )}
                        {this.activeTab === 0 && (
                            <Link to={routeGame.path(LobbyMode.HOST)}>
                                <Form.Button
                                    icon="chess king"
                                    labelPosition="left"
                                    primary
                                    className="PageMainMenu__button"
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
