import { Action, IActionsHub } from "Library/Flux/Action";
import { WebApiTagDefinition } from "TFS/Core/Contracts";

export class WorkItemTagActionsHub implements IActionsHub {
    public InitializeTags = new Action<WebApiTagDefinition[]>();
}
