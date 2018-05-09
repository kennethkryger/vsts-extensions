import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WorkItemTemplateReference } from "TFS/WorkItemTracking/Contracts";

export const KeyName = "WorkItemTemplate";

export class WorkItemTemplateActionsHub extends BaseActionsHub {
    public InitializeWorkItemTemplates = new Action<{teamId: string, templates: WorkItemTemplateReference[]}>();

    public getKey(): string {
        return KeyName;
    }
}
