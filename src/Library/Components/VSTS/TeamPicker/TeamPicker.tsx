import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ISimpleComboProps, SimpleCombo } from "Library/Components/VssCombo/SimpleCombo";
import { BaseStore } from "Library/Flux/BaseStore";
import { TeamActionsCreator, TeamStore } from "Library/Flux/Team";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WebApiTeam } from "TFS/Core/Contracts";

export interface ITeamPickerProps extends ISimpleComboProps<WebApiTeam> {
    store: TeamStore;
    actionsCreator: TeamActionsCreator;
}

export interface ITeamPickerState extends IBaseFluxComponentState {
    allTeams?: WebApiTeam[];
}

export class TeamPicker extends BaseFluxComponent<ITeamPickerProps, ITeamPickerState> {
    public componentDidMount() {
        super.componentDidMount();
        if (this.props.store.isLoaded()) {
            this.setState({
                allTeams: this.props.store.getAll()
            });
        }
        else {
            this.props.actionsCreator.initializeTeams();
        }
    }

    public render(): JSX.Element {
        if (!this.state.allTeams) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const props = {
            ...this.props,
            className: css("team-picker", this.props.className),
            getItemText: (team: WebApiTeam) => team.name,
            options: this.state.allTeams,
            limitedToAllowedOptions: true
        } as ISimpleComboProps<WebApiTeam>;

        return <SimpleCombo {...props} />;
    }

    protected getStores(): BaseStore<any, any, any, any>[] {
        return [this.props.store];
    }

    protected getStoresState(): ITeamPickerState {
        return {
            allTeams: this.props.store.getAll()
        };
    }
}
