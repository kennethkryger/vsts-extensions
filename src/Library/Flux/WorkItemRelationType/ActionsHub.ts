import { Action, IActionsHub } from "Library/Flux/Action";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";

export class WorkItemRelationTypeActionsHub implements IActionsHub {
    public InitializeWorkItemRelationTypes = new Action<WorkItemRelationType[]>();
}
