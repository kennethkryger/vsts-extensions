import { Action, IActionsHub } from "Library/Flux/Action";

export class WorkItemTypeFieldAllowedValuesActionsHub implements IActionsHub {
    public InitializeAllowedValues = new Action<{workItemType: string, fieldRefName: string, allowedValues: string[]}>();
}
