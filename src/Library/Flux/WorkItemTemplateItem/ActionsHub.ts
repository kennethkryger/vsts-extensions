import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WorkItemTemplate } from "TFS/WorkItemTracking/Contracts";

export const KeyName = "WorkItemTemplateItem";

export class WorkItemTemplateItemActionsHub extends BaseActionsHub {
    public InitializeWorkItemTemplateItem = new Action<WorkItemTemplate>();

    public getKey(): string {
        return KeyName;
    }
}
