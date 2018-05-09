import { Action, IActionsHub } from "Library/Flux/Action";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";

export class WorkItemFieldActionsHub implements IActionsHub {
    public InitializeWorkItemFields = new Action<WorkItemField[]>();
}
