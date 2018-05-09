import { Action, IActionsHub } from "Library/Flux/Action";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";

export class WorkItemTypeActionsHub implements IActionsHub {
    public InitializeWorkItemTypes = new Action<WorkItemType[]>();
}
