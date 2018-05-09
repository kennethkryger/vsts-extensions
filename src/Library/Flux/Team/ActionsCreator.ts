import { IActionsCreator } from "Library/Flux/Action";
import { TeamActionsHub, TeamStore } from "Library/Flux/Team";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WebApiTeam } from "TFS/Core/Contracts";
import * as CoreClient from "TFS/Core/RestClient";
import * as VSS_Service from "VSS/Service";

export class TeamActionsCreator implements IActionsCreator {
    constructor(private _actionsHub: TeamActionsHub, private _teamStore: TeamStore) {}

    public async initializeTeams() {
        if (this._teamStore.isLoaded()) {
            this._actionsHub.InitializeTeams.invoke(null);
        }
        else if (!this._teamStore.isLoading()) {
            this._teamStore.setLoading(true);
            try {
                const teams = await this._getTeams();
                teams.sort((a: WebApiTeam, b: WebApiTeam) => localeIgnoreCaseComparer(a.name, b.name));
                this._actionsHub.InitializeTeams.invoke(teams);
                this._teamStore.setLoading(false);
            }
            catch (e) {
                this._teamStore.setLoading(false);
                throw e.message;
            }
        }
    }

    private async _getTeams(): Promise<WebApiTeam[]> {
        const teams: WebApiTeam[] = [];
        const top: number = 300;
        const client = await VSS_Service.getClient<CoreClient.CoreHttpClient4>(CoreClient.CoreHttpClient4);
        const project = VSS.getWebContext().project.id;

        const getTeamDelegate = async (skip: number) => {
            const result: WebApiTeam[] = await client.getTeams(project, top, skip);
            if (result.length > 0) {
                teams.push(...result);
            }
            if (result.length === top) {
                await getTeamDelegate(skip + top);
            }
            return;
        };

        await getTeamDelegate(0);
        return teams;
    }
}
