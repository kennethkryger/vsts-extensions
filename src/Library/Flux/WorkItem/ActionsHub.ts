import { Action, IActionsHub } from "Library/Flux/Action";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";

export class WorkItemActionsHub implements IActionsHub {
    public AddOrUpdateWorkItems = new Action<WorkItem[]>();
    public DeleteWorkItems = new Action<number[]>();
    public ClearWorkItems = new Action();
}
