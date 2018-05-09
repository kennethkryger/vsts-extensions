import { BaseStore } from "Library/Flux/BaseStore";
import { TeamFieldActionsHub } from "Library/Flux/TeamField";
import { TeamFieldValues } from "TFS/Work/Contracts";

export class TeamFieldStore extends BaseStore<IDictionaryStringTo<TeamFieldValues>, TeamFieldValues, string, TeamFieldActionsHub> {
    constructor(actionsHub: TeamFieldActionsHub) {
        super(actionsHub);
        this.items = {};
    }

    public getItem(teamId: string): TeamFieldValues {
         return this.items[teamId.toLowerCase()] || null;
    }

    public getKey(): string {
        return "TeamFieldStore";
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeTeamFieldItem.addListener((values: {teamId: string, teamFieldValues: TeamFieldValues}) => {
            if (values) {
                this.items[values.teamId.toLowerCase()] = values.teamFieldValues;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
