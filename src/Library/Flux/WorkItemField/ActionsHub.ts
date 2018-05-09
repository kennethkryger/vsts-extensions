import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";

export const KeyName = "WorkItemField";

export class WorkItemFieldActionsHub extends BaseActionsHub {
    public InitializeWorkItemFields = new Action<WorkItemField[]>();

    public getKey(): string {
        return KeyName;
    }
}
