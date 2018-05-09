import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WebApiTeam } from "TFS/Core/Contracts";

export const KeyName = "Team";

export class TeamActionsHub extends BaseActionsHub {
    public InitializeTeams = new Action<WebApiTeam[]>();

    public getKey(): string {
        return KeyName;
    }
}
