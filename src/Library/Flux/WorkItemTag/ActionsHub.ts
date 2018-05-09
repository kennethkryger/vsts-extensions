import { Action, BaseActionsHub } from "Library/Flux/Action";
import { WebApiTagDefinition } from "TFS/Core/Contracts";

export const KeyName = "WorkItemTag";

export class WorkItemTagActionsHub extends BaseActionsHub {
    public InitializeTags = new Action<WebApiTagDefinition[]>();

    public getKey(): string {
        return KeyName;
    }
}
