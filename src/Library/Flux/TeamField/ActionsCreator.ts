import { BaseActionsCreator } from "Library/Flux/Action";
import { KeyName, TeamFieldActionsHub, TeamFieldStore } from "Library/Flux/TeamField";
import { TeamContext } from "TFS/Core/Contracts";
import * as WorkClient from "TFS/Work/RestClient";

export class TeamFieldActionsCreator extends BaseActionsCreator {
    constructor(private _actionsHub: TeamFieldActionsHub, private _teamFieldStore: TeamFieldStore) {
        super();
    }

    public getKey(): string {
        return KeyName;
    }

    public async initializeTeamFields(teamId: string) {
        if (this._teamFieldStore.isLoaded(teamId)) {
            this._actionsHub.InitializeTeamFieldItem.invoke(null);
        }
        else if (!this._teamFieldStore.isLoading(teamId)) {
            this._teamFieldStore.setLoading(true, teamId);
            try {
                const teamContext: TeamContext = {
                    project: "",
                    projectId: VSS.getWebContext().project.id,
                    team: "",
                    teamId: teamId
                };

                const teamFieldValues = await WorkClient.getClient().getTeamFieldValues(teamContext);
                this._actionsHub.InitializeTeamFieldItem.invoke({teamId: teamId, teamFieldValues: teamFieldValues});
                this._teamFieldStore.setLoading(false, teamId);
            }
            catch (e) {
                this._teamFieldStore.setLoading(false, teamId);
                throw e.message;
            }
        }
    }
}
