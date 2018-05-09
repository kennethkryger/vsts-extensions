import { Action, BaseActionsHub } from "Library/Flux/Action";

export const KeyName = "WorkItemTypeFieldAllowedValues";

export class WorkItemTypeFieldAllowedValuesActionsHub extends BaseActionsHub {
    public InitializeAllowedValues = new Action<{workItemType: string, fieldRefName: string, allowedValues: string[]}>();

    public getKey(): string {
        return KeyName;
    }
}
