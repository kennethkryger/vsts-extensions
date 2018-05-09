import { BaseStore } from "Library/Flux/BaseStore";
import { KeyName, WorkItemStateItemActionsHub } from "Library/Flux/WorkItemStateItem";
import { WorkItemStateColor } from "TFS/WorkItemTracking/Contracts";

export class WorkItemStateItemStore extends BaseStore<IDictionaryStringTo<WorkItemStateColor[]>, WorkItemStateColor[], string, WorkItemStateItemActionsHub> {
    constructor(actionsHub: WorkItemStateItemActionsHub) {
        super(actionsHub);
        this.items = {};
    }

    public getItem(witName: string): WorkItemStateColor[] {
        return this.items[witName.toLowerCase()];
    }

    public getKey(): string {
        return KeyName;
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeWorkItemStateItems.addListener((stateItems: {witName: string, states: WorkItemStateColor[]}) => {
            if (stateItems) {
                this.items[stateItems.witName.toLowerCase()] = stateItems.states;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
