import { Action, BaseActionsHub } from "Library/Flux/Action";
import { TeamFieldValues } from "TFS/Work/Contracts";

export const KeyName = "TeamField";

export class TeamFieldActionsHub extends BaseActionsHub {
    public InitializeTeamFieldItem = new Action<{teamId: string, teamFieldValues: TeamFieldValues}>();

    public getKey(): string {
        return KeyName;
    }
}
