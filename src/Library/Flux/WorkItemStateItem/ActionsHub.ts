import { Action, IActionsHub } from "Library/Flux/Action";
import { WorkItemStateColor } from "TFS/WorkItemTracking/Contracts";

export class WorkItemStateItemActionsHub implements IActionsHub {
    public InitializeWorkItemStateItems = new Action<{witName: string, states: WorkItemStateColor[]}>();
}
