import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";

export const KeyName = "ClassificationNode";

export class ClassificationNodeActionsHub extends BaseActionsHub {
    public InitializeAreaPaths = new Action<WorkItemClassificationNode>();
    public InitializeIterationPaths = new Action<WorkItemClassificationNode>();

    public getKey(): string {
        return KeyName;
    }
}
