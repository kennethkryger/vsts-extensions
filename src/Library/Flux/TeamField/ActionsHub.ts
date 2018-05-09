import { Action, IActionsHub } from "Library/Flux/Action";
import { TeamFieldValues } from "TFS/Work/Contracts";

export class TeamFieldActionsHub implements IActionsHub {
    public InitializeTeamFieldItem = new Action<{teamId: string, teamFieldValues: TeamFieldValues}>();
}
