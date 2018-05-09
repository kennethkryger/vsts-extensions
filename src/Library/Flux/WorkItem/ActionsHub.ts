import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";

export const KeyName = "WorkItem";

export class WorkItemActionsHub extends BaseActionsHub {
    public AddOrUpdateWorkItems = new Action<WorkItem[]>();
    public DeleteWorkItems = new Action<number[]>();
    public ClearWorkItems = new Action();

    public getKey(): string {
        return KeyName;
    }
}
