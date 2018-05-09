import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WorkItemStateColor } from "TFS/WorkItemTracking/Contracts";

export const KeyName = "WorkItemStateItem";

export class WorkItemStateItemActionsHub extends BaseActionsHub {
    public InitializeWorkItemStateItems = new Action<{witName: string, states: WorkItemStateColor[]}>();

    public getKey(): string {
        return KeyName;
    }
}
