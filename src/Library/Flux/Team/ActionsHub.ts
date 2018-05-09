import { Action, IActionsHub } from "Library/Flux/Action";
import { WebApiTeam } from "TFS/Core/Contracts";

export class TeamActionsHub implements IActionsHub {
    public InitializeTeams = new Action<WebApiTeam[]>();
}
