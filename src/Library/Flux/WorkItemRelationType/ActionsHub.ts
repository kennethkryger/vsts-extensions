import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";

export const KeyName = "WorkItemRelationType";

export class WorkItemRelationTypeActionsHub extends BaseActionsHub {
    public InitializeWorkItemRelationTypes = new Action<WorkItemRelationType[]>();

    public getKey(): string {
        return KeyName;
    }
}
