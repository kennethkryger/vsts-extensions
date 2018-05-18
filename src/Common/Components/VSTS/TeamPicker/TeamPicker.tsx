import * as React from "react";

import { IVssComponentState, VssComponent } from "Common/Components/Utilities/VssComponent";
import { ISimpleComboProps, SimpleCombo } from "Common/Components/VssCombo/SimpleCombo";
import { BaseDataService } from "Common/Services/BaseDataService";
import { TeamService, TeamServiceName } from "Common/Services/TeamService";
import { IReactAppContext } from "Common/Utilities/Context";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WebApiTeam } from "TFS/Core/Contracts";

export interface ITeamPickerState extends IVssComponentState {
    allTeams?: WebApiTeam[];
}

export class TeamPicker extends VssComponent<ISimpleComboProps<WebApiTeam>, ITeamPickerState> {
    private _teamService: TeamService;

    constructor(props: ISimpleComboProps<WebApiTeam>, context?: IReactAppContext) {
        super(props, context);
        this._teamService = this.context.appContext.getService<TeamService>(TeamServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        if (this._teamService.isLoaded()) {
            this.setState({
                allTeams: this._teamService.getAll()
            });
        }
        else {
            this._teamService.initializeTeams();
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

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._teamService];
    }

    protected getDataServiceState(): ITeamPickerState {
        return {
            allTeams: this._teamService.getAll()
        };
    }
}
