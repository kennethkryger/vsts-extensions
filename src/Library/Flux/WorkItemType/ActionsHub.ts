import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";

export const KeyName = "WorkItemType";

export class WorkItemTypeActionsHub extends BaseActionsHub {
    public InitializeWorkItemTypes = new Action<WorkItemType[]>();

    public getKey(): string {
        return KeyName;
    }
}
