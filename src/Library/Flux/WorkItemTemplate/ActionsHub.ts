import { Action, IActionsHub } from "Library/Flux/Action";
import { WorkItemTemplateReference } from "TFS/WorkItemTracking/Contracts";

export class WorkItemTemplateActionsHub implements IActionsHub {
    public InitializeWorkItemTemplates = new Action<{teamId: string, templates: WorkItemTemplateReference[]}>();
}
