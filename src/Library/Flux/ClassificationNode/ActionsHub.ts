import { Action, IActionsHub } from "Library/Flux/Action";
import { WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";

export class ClassificationNodeActionsHub implements IActionsHub {
    public InitializeAreaPaths = new Action<WorkItemClassificationNode>();
    public InitializeIterationPaths = new Action<WorkItemClassificationNode>();
}
