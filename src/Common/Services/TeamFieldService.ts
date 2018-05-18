import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { TeamContext } from "TFS/Core/Contracts";
import { TeamFieldValues } from "TFS/Work/Contracts";
import * as WorkClient from "TFS/Work/RestClient";

export const TeamFieldServiceName = "TeamFieldService";

export class TeamFieldService extends BaseDataService<IDictionaryStringTo<TeamFieldValues>, TeamFieldValues, string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(teamId: string): TeamFieldValues {
         return this.items[teamId.toLowerCase()] || null;
    }

    public getKey(): string {
        return TeamFieldServiceName;
    }

    public async initializeTeamFields(teamId: string) {
        if (this.isLoaded(teamId)) {
            this._notifyChanged();
        }
        else if (!this.isLoading(teamId)) {
            this.setLoading(true, teamId);
            try {
                const teamContext: TeamContext = {
                    project: "",
                    projectId: VSS.getWebContext().project.id,
                    team: "",
                    teamId: teamId
                };

                const teamFieldValues = await WorkClient.getClient().getTeamFieldValues(teamContext);
                this._addTeamFieldItem(teamId, teamFieldValues);
            }
            catch (e) {
                this.setLoading(false, teamId);
                throw e.message;
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _addTeamFieldItem(teamId: string, teamFieldValues: TeamFieldValues) {
        if (teamId && teamFieldValues) {
            this.items[teamId.toLowerCase()] = teamFieldValues;
        }

        this.setLoading(false, teamId);
    }
}

Services.add(TeamFieldServiceName, { serviceFactory: TeamFieldService });
