import { Action, IActionsHub } from "Library/Flux/Action";
import { WorkItemTemplate } from "TFS/WorkItemTracking/Contracts";

export class WorkItemTemplateItemActionsHub implements IActionsHub {
    public InitializeWorkItemTemplateItem = new Action<WorkItemTemplate>();
}
